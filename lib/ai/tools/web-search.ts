import { buildSystemPrompt } from '@/lib/ai/prompts';
import {
  toVercelChatMessages,
  validatePerplexityMessages,
} from '@/lib/ai/message-utils';
import llmConfig from '@/lib/models/llm-config';
import PostHogClient from '@/app/posthog';
import type { ChatMetadata, LLMID, ModelParams } from '@/types';
import {
  generateTitleFromUserMessage,
  handleFinalChatAndAssistantMessage,
} from '@/lib/ai/actions';
import { removePdfContentFromMessages } from '@/lib/build-prompt-backend';
import { ChatSDKError } from '@/lib/errors';
import type { Doc } from '@/convex/_generated/dataModel';

interface WebSearchConfig {
  chat: Doc<'chats'> | null;
  messages: any[];
  modelParams: ModelParams;
  profile: any;
  dataStream: any;
  isLargeModel: boolean;
  directToolCall?: boolean;
  abortSignal: AbortSignal;
  chatMetadata: ChatMetadata;
  model: LLMID;
  userCountryCode: string | null;
  initialChatPromise: Promise<void>;
  assistantMessageId: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size: string;
  };
  citations: string[];
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string | null;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
}

interface StreamDelta {
  type: 'text-delta' | 'citations';
  textDelta?: string;
  citations?: string[];
}

async function getProviderConfig(isLargeModel: boolean, profile: any) {
  const defaultModel = 'sonar';
  const proModel = 'sonar-pro';

  const selectedModel = isLargeModel ? proModel : defaultModel;

  const systemPrompt = buildSystemPrompt(
    llmConfig.systemPrompts.pentestGPTWebSearch,
    profile.profile_context,
  );

  return {
    systemPrompt,
    selectedModel,
  };
}

async function* streamPerplexityResponse(
  response: Response,
): AsyncGenerator<StreamDelta> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let citationsSent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed: PerplexityResponse = JSON.parse(data);

            // Handle citations from the first message
            if (!citationsSent && parsed.citations?.length > 0) {
              yield { type: 'citations', citations: parsed.citations };
              citationsSent = true;
            }

            // Handle content from delta
            const delta = parsed.choices[0]?.delta;
            if (delta?.content) {
              yield { type: 'text-delta', textDelta: delta.content };
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function getResponseBody(response: Response): Promise<string> {
  try {
    const clone = response.clone();
    const text = await clone.text();
    return text;
  } catch (e) {
    return 'Unable to read response body';
  }
}

async function makePerplexityRequest(payload: any, abortSignal: AbortSignal) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: abortSignal,
  });

  if (!response.ok) {
    const responseBody = await getResponseBody(response);
    let errorData;
    try {
      errorData = JSON.parse(responseBody);
    } catch (e) {
      // If parsing fails, create a ChatSDKError with the raw response body
      throw new ChatSDKError('bad_request:api', responseBody);
    }
    return { error: errorData, response };
  }

  return { response };
}

export async function executeWebSearchTool({
  config,
}: {
  config: WebSearchConfig;
}) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not set for web search');
  }

  const {
    chat,
    messages,
    modelParams,
    profile,
    dataStream,
    isLargeModel,
    abortSignal,
    chatMetadata,
    model,
    userCountryCode,
    initialChatPromise,
    assistantMessageId,
  } = config;

  // Filter out PDF content from messages
  const filteredMessages = removePdfContentFromMessages(messages);

  // Validate messages for proper alternating roles
  const validatedMessages = validatePerplexityMessages(filteredMessages);

  const { systemPrompt, selectedModel } = await getProviderConfig(
    isLargeModel,
    profile,
  );

  const posthog = PostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: profile.user_id,
      event: 'web_search_executed',
    });
  }

  dataStream.writeData({
    type: 'tool-call',
    content: 'websearch',
  });

  let generatedTitle: string | undefined;
  let assistantMessage = '';
  const citations: string[] = [];
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

    const requestPayload = {
      model: selectedModel,
      system: systemPrompt,
      messages: toVercelChatMessages(validatedMessages, true, true),
      stream: true,
      max_tokens: 2048,
      web_search_options: {
        search_context_size: 'medium',
        ...(userCountryCode && {
          user_location: { country: userCountryCode },
        }),
      },
    };

    let { response, error } = await makePerplexityRequest(
      requestPayload,
      abortSignal,
    );

    // If we get a country code error, retry without user location
    if (error?.error?.type === 'invalid_country_code') {
      const retryPayload = {
        ...requestPayload,
        web_search_options: { search_context_size: 'medium' },
      };
      ({ response, error } = await makePerplexityRequest(
        retryPayload,
        abortSignal,
      ));
    }

    if (error) {
      console.error('[WebSearch] Error Details:', {
        status: response.status,
        statusText: response.statusText,
        requestPayload: {
          model: requestPayload.model,
          messageCount: requestPayload.messages.length,
        },
        responseBody: error,
        headers: Object.fromEntries(response.headers.entries()),
      });
      throw new Error(
        `Web search failed: ${response.status} ${response.statusText}`,
      );
    }

    let hasFirstTextDelta = false;

    for await (const delta of streamPerplexityResponse(response)) {
      if (delta.type === 'citations' && delta.citations) {
        citations.push(...delta.citations);
      }

      if (delta.type === 'text-delta' && delta.textDelta) {
        if (!hasFirstTextDelta) {
          dataStream.writeData({ citations });
          hasFirstTextDelta = true;
        }

        assistantMessage += delta.textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: delta.textDelta,
        });
      }
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
      assistantMessage,
      citations,
      assistantMessageId,
    });

    return 'Web search completed';
  } catch (error) {
    if (!(error instanceof Error && error.message === 'terminated')) {
      console.error('[WebSearch] Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: selectedModel,
      });
    }
    throw error;
  }
}
