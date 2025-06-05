import {
  toVercelChatMessages,
  validatePerplexityMessages,
} from '@/lib/ai/message-utils';
import PostHogClient from '@/app/posthog';
import type { ChatMetadata, LLMID, ModelParams } from '@/types';
import {
  generateTitleFromUserMessage,
  handleFinalChatAndAssistantMessage,
} from '@/lib/ai/actions';
import { removePdfContentFromMessages } from '@/lib/build-prompt-backend';
import { streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { v4 as uuidv4 } from 'uuid';
import type { Doc } from '@/convex/_generated/dataModel';

interface DeepResearchConfig {
  chat: Doc<'chats'> | null;
  messages: any[];
  profile: any;
  dataStream: any;
  modelParams: ModelParams;
  abortSignal: AbortSignal;
  chatMetadata: ChatMetadata;
  model: LLMID;
  userCountryCode: string | null;
  originalMessages: any[];
  systemPrompt: string;
  initialChatPromise: Promise<void>;
}

// Keepalive interval in milliseconds
const KEEPALIVE_INTERVAL = 30000; // 30 seconds

export async function executeDeepResearchTool({
  config,
}: {
  config: DeepResearchConfig;
}) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not set for deep research');
  }

  const {
    chat,
    messages,
    profile,
    dataStream,
    modelParams,
    chatMetadata,
    userCountryCode,
    abortSignal,
    model,
    originalMessages,
    systemPrompt,
    initialChatPromise,
  } = config;

  // Filter out PDF content from messages
  const filteredMessages = removePdfContentFromMessages(messages);

  // Validate messages for proper alternating roles
  const validatedMessages = validatePerplexityMessages(filteredMessages);

  const posthog = PostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: profile.user_id,
      event: 'deep_research_executed',
    });
  }

  dataStream.writeData({
    type: 'tool-call',
    content: 'deep-research',
  });

  let generatedTitle: string | undefined;
  const citations: string[] = [];
  let isThinking = false;
  let thinkingStartTime: number | null = null;
  const assistantMessageId = uuidv4();
  let titleGenerationPromise: Promise<void> | null = null;

  // Set up keepalive interval
  const keepaliveInterval = setInterval(() => {
    if (!abortSignal.aborted) {
      dataStream.writeData({
        type: 'keepalive',
        content: '',
      });
    }
  }, KEEPALIVE_INTERVAL);

  try {
    // Start title generation if needed
    if (chatMetadata.id && !chat) {
      titleGenerationPromise = (async () => {
        generatedTitle = await generateTitleFromUserMessage({
          messages: originalMessages,
          abortSignal,
        });
        dataStream.writeData({ chatTitle: generatedTitle });
      })();
    }

    const result = streamText({
      model: myProvider.languageModel('deep-research-model'),
      system: systemPrompt,
      messages: toVercelChatMessages(validatedMessages),
      maxTokens: 8192,
      experimental_generateMessageId: () => assistantMessageId,
      providerOptions: {
        perplexity: {
          web_search_options: {
            search_context_size: 'medium',
            ...(userCountryCode && {
              user_location: { country: userCountryCode },
            }),
          },
        },
      },
      onChunk: async (chunk) => {
        if (chunk.chunk.type === 'reasoning') {
          if (!isThinking) {
            isThinking = true;
            thinkingStartTime = Date.now();
          }
        }
      },
      onError: async (error) => {
        console.error('[DeepResearch] Stream Error:', error);
      },
      onFinish: async ({ text, reasoning }) => {
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
          finishReason: 'stop',
          title: generatedTitle,
          assistantMessage: text,
          citations,
          thinkingText: reasoning || undefined,
          thinkingElapsedSecs,
          assistantMessageId,
        });
      },
    });

    for await (const part of result.fullStream) {
      if (part.type === 'source' && part.source.sourceType === 'url') {
        citations.push(part.source.url);
        dataStream.writeData({ citations });
      }
    }

    result.mergeIntoDataStream(dataStream, { sendReasoning: true });

    return 'Deep research completed';
  } catch (error) {
    if (!(error instanceof Error && error.message === 'terminated')) {
      console.error('[DeepResearch] Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    throw error;
  } finally {
    // Clear keepalive interval
    clearInterval(keepaliveInterval);
  }
}
