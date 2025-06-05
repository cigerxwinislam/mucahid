import { getAIProfile } from '@/lib/server/server-chat-helpers';
import { handleErrorResponse } from '@/lib/models/api-error';
import { checkRatelimitOnApi } from '@/lib/server/ratelimiter';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import PostHogClient from '@/app/posthog';
import { handleToolExecution } from '@/lib/ai/tool-handler';
import { createToolSchemas } from '@/lib/ai/tools/toolSchemas';
import {
  processChatMessages,
  toVercelChatMessages,
} from '@/lib/ai/message-utils';
import { type LLMID, PluginID } from '@/types';
import {
  generateTitleFromUserMessage,
  handleInitialChatAndUserMessage,
  handleFinalChatAndAssistantMessage,
} from '@/lib/ai/actions';
import { validateChatAccess } from '@/lib/ai/actions/chat-validation';
import { createClient } from '@/lib/supabase/server';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { ChatSDKError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 180;

export async function POST(request: Request) {
  const abortController = new AbortController();
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { messages, model, modelParams, chatMetadata } = requestBody;
    const userCountryCode = request.headers.get('x-vercel-ip-country');

    const { profile } = await getAIProfile();
    const config = await getProviderConfig(
      model,
      profile,
      modelParams.selectedPlugin,
    );

    if (!config.isRateLimitAllowed) {
      return new Response(
        JSON.stringify({
          error: {
            type: 'ratelimit_hit',
            message: config.rateLimitInfo.message,
            isPremiumUser: config.isPremiumUser,
          },
        }),
        { status: 429 },
      );
    }

    const chat = await validateChatAccess({
      chatMetadata,
      userId: profile.user_id,
    });

    const supabase = await createClient();
    const isReasoningModel = model === 'reasoning-model';
    let generatedTitle: string | undefined;
    let toolUsed = '';
    let hasGeneratedTitle = false;
    let titleGenerationPromise: Promise<void> | null = null;

    const { processedMessages, systemPrompt } = await processChatMessages(
      messages,
      config.selectedModel,
      modelParams,
      profile,
      isReasoningModel,
      supabase,
      config.isPremiumUser,
    );

    // Handle initial chat creation and user message in parallel with other operations
    const initialChatPromise = handleInitialChatAndUserMessage({
      modelParams,
      chatMetadata,
      profile,
      model,
      chat,
      messages,
    });

    const toolResponse = await handleToolExecution({
      chat,
      messages: processedMessages,
      modelParams,
      profile,
      isLargeModel: config.isLargeModel,
      abortSignal: abortController.signal,
      chatMetadata,
      model,
      isReasoningModel,
      rateLimitInfo: config.rateLimitInfo,
      initialChatPromise,
    });
    if (toolResponse) {
      return toolResponse;
    }

    const posthog = PostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: profile.user_id,
        event: config.selectedModel,
      });
    }

    const assistantMessageId = uuidv4();

    try {
      return createDataStreamResponse({
        execute: async (dataStream) => {
          dataStream.writeData({
            type: 'ratelimit',
            content: config.rateLimitInfo,
          });

          const result = streamText({
            model: myProvider.languageModel(config.selectedModel),
            system: systemPrompt,
            messages: toVercelChatMessages(processedMessages, true),
            maxTokens: 2048,
            abortSignal: abortController.signal,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: () => assistantMessageId,
            onChunk: async (chunk: any) => {
              if (chunk.chunk.type === 'tool-call') {
                toolUsed = chunk.chunk.toolName;
              } else if (
                !hasGeneratedTitle &&
                chatMetadata.id &&
                !chat &&
                !toolUsed &&
                chunk.chunk.type === 'text-delta'
              ) {
                hasGeneratedTitle = true;
                titleGenerationPromise = (async () => {
                  generatedTitle = await generateTitleFromUserMessage({
                    messages,
                    abortSignal: abortController.signal,
                  });
                  dataStream.writeData({ chatTitle: generatedTitle });
                })();
              }
            },
            onError: async (error) => {
              if (
                !(
                  error instanceof Error &&
                  error.name === 'AI_ToolExecutionError' &&
                  error.message.includes('terminated')
                ) &&
                !(
                  error instanceof Error &&
                  error.name === 'AI_InvalidToolArgumentsError'
                )
              ) {
                console.error('[Chat] Stream Error:', error);
              }
            },
            tools: createToolSchemas({
              chat,
              messages: processedMessages,
              modelParams,
              profile,
              dataStream,
              abortSignal: abortController.signal,
              chatMetadata,
              model,
              userCountryCode,
              initialChatPromise,
              assistantMessageId,
            }).getSelectedSchemas(
              config.isPremiumUser && !modelParams.isTemporaryChat
                ? ['browser', 'webSearch', 'terminal']
                : ['browser', 'webSearch'],
            ),
            onFinish: async ({ finishReason, text }) => {
              if (!toolUsed) {
                // Wait for title generation if it's in progress
                if (titleGenerationPromise) {
                  await titleGenerationPromise;
                }
                // Wait for initial chat handling to complete before final handling
                await initialChatPromise;
                await handleFinalChatAndAssistantMessage({
                  modelParams,
                  chatMetadata,
                  profile,
                  model,
                  chat,
                  finishReason,
                  title: generatedTitle,
                  assistantMessage: text,
                  assistantMessageId,
                });
              }
            },
          });

          result.mergeIntoDataStream(dataStream);

          // Then ensure title generation completes if it was started
          if (titleGenerationPromise) {
            await titleGenerationPromise;
          }
        },
      });
    } catch (error) {
      return handleErrorResponse(error);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}

async function getProviderConfig(
  model: LLMID,
  profile: any,
  selectedPlugin: PluginID,
) {
  // Moving away from gpt-4-turbo-preview to chat-model-large
  const modelMap: Record<string, string> = {
    'mistral-medium': 'chat-model-small-with-tools',
    'mistral-large': 'chat-model-large-with-tools',
    'gpt-4-turbo-preview': 'chat-model-large-with-tools',
    'reasoning-model': 'reasoning-model',
  };
  // Moving away from gpt-4-turbo-preview to pentestgpt-pro
  const rateLimitModelMap: Record<string, string> = {
    'mistral-medium': 'pentestgpt',
    'mistral-large': 'pentestgpt-pro',
    'gpt-4-turbo-preview': 'pentestgpt-pro',
  };

  const selectedModel = modelMap[model];
  if (!selectedModel) {
    throw new Error('Selected model is undefined');
  }
  const isLargeModel = selectedModel.includes('large');

  const rateLimitModel =
    selectedPlugin !== PluginID.NONE
      ? selectedPlugin
      : rateLimitModelMap[model] || model;

  const rateLimitStatus = await checkRatelimitOnApi(
    profile.user_id,
    rateLimitModel,
  );

  return {
    selectedModel,
    isRateLimitAllowed: rateLimitStatus.allowed,
    isLargeModel,
    rateLimitInfo: rateLimitStatus.info,
    isPremiumUser: rateLimitStatus.info.isPremiumUser,
  };
}
