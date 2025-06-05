import { getSystemPrompt } from '@/lib/ai/prompts';
import { toVercelChatMessages } from '@/lib/ai/message-utils';
import { streamText, tool } from 'ai';
import PostHogClient from '@/app/posthog';
import type { ChatMetadata, LLMID, RateLimitInfo, ModelParams } from '@/types';
import {
  handleFinalChatAndAssistantMessage,
  generateTitleFromUserMessage,
} from '@/lib/ai/actions';
import { myProvider } from '../providers';
import { z } from 'zod';
import { getPageContent } from './browser';
import { v4 as uuidv4 } from 'uuid';
import type { Doc } from '@/convex/_generated/dataModel';

interface ReasonLLMConfig {
  chat: Doc<'chats'> | null;
  messages: any[];
  profile: any;
  modelParams: ModelParams;
  dataStream: any;
  isLargeModel: boolean;
  abortSignal: AbortSignal;
  chatMetadata: ChatMetadata;
  model: LLMID;
  rateLimitInfo: RateLimitInfo;
  initialChatPromise: Promise<void>;
}

async function getProviderConfig(profile: any) {
  const selectedModel = 'chat-model-reasoning';
  const systemPrompt = getSystemPrompt({
    selectedChatModel: selectedModel,
    profileContext: profile.profile_context,
  });

  return {
    systemPrompt,
    model: myProvider.languageModel(selectedModel),
  };
}

export async function executeReasonLLMTool({
  config,
}: {
  config: ReasonLLMConfig;
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not set for reason LLM');
  }

  const {
    chat,
    messages,
    modelParams,
    profile,
    dataStream,
    abortSignal,
    chatMetadata,
    model,
    initialChatPromise,
  } = config;
  const { systemPrompt, model: selectedModel } =
    await getProviderConfig(profile);

  const posthog = PostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: profile.user_id,
      event: 'reason_llm_executed',
    });
  }

  dataStream.writeData({
    type: 'ratelimit',
    content: config.rateLimitInfo,
  });

  let generatedTitle: string | undefined;
  let thinkingStartTime: number | null = null;
  let isThinking = false;
  const assistantMessageId = uuidv4();
  let titleGenerationPromise: Promise<void> | null = null;

  try {
    // Start title generation if needed
    if (chatMetadata.id && !chat) {
      titleGenerationPromise = (async () => {
        generatedTitle = await generateTitleFromUserMessage({
          messages,
          abortSignal: config.abortSignal,
        });
        dataStream.writeData({ chatTitle: generatedTitle });
      })();
    }

    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      messages: toVercelChatMessages(messages),
      maxTokens: 8192,
      abortSignal,
      maxSteps: 2,
      tools: {
        open_url: tool({
          description: `Use the browser tool to open a specific URL and extract its content. \
Some examples of when to use the browser tool include:
- When the user explicitly requests to visit, open, browse, or view a specific webpage or URL.
- When the user directly instructs you to access a specific website they've mentioned.
- When performing security testing, vulnerability assessment, or penetration testing of a website.

Do not use browser tool for general information queries that can be answered without visiting a URL.
Do not use browser tool if the user merely mentions a URL without explicitly asking you to open it.
The browser tool cannot access IP addresses (like http://192.168.1.1), or non-standard URLs.

The browser tool can extract content in two formats:
- markdown: Use for general content reading and information extraction (default).
- html: Use for security testing, vulnerability assessment, and penetration testing to analyze HTML \
structure, forms, scripts, and potential security issues. Also use when HTML content would be more \
beneficial for the user's needs.`,
          parameters: z.object({
            url: z.string().describe('The URL of the webpage to open'),
            format: z
              .enum(['markdown', 'html'])
              .describe('The format of the output content.'),
          }),
          execute: async ({ url, format }) => {
            dataStream.writeData({
              type: 'agent-status',
              content: 'browser',
            });
            const content = await getPageContent(url, format);
            return content;
          },
        }),
      },
      experimental_generateMessageId: () => assistantMessageId,
      onChunk: async (chunk) => {
        if (chunk.chunk.type === 'tool-result') {
          dataStream.writeData({
            type: 'agent-status',
            content: 'none',
          });

          dataStream.writeData({
            type: 'reasoning',
            content: '\n\n',
          });
        } else if (chunk.chunk.type === 'reasoning') {
          if (!isThinking) {
            isThinking = true;
            thinkingStartTime = Date.now();
          }
        }
      },
      onError: async (error) => {
        console.error('[ReasonLLM] Stream Error:', error);
      },
      onFinish: async ({
        finishReason,
        text,
        reasoning,
      }: {
        finishReason: string;
        text: string;
        reasoning: string | undefined;
      }) => {
        let thinkingElapsedSecs = null;
        if (isThinking && thinkingStartTime) {
          isThinking = false;
          thinkingElapsedSecs = Math.round(
            (Date.now() - thinkingStartTime) / 1000,
          );
          dataStream.writeData({
            type: 'thinking-time',
            elapsed_secs: thinkingElapsedSecs,
          });
        }

        // Wait for both title generation and initial chat handling to complete
        await Promise.all([titleGenerationPromise, initialChatPromise]);

        await handleFinalChatAndAssistantMessage({
          modelParams,
          chatMetadata,
          profile,
          model,
          chat,
          finishReason,
          title: generatedTitle,
          assistantMessage: text,
          thinkingText: reasoning || undefined,
          thinkingElapsedSecs,
          assistantMessageId,
        });
      },
    });

    result.mergeIntoDataStream(dataStream, { sendReasoning: true });

    return 'Reason LLM execution completed';
  } catch (error) {
    // Skip logging for terminated errors
    if (!(error instanceof Error && error.message === 'terminated')) {
      console.error('[ReasonLLM] Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
      });
    }
    throw error;
  }
}
