import { getAIProfile } from '@/lib/server/server-chat-helpers';
import { handleErrorResponse } from '@/lib/models/api-error';
import { checkRatelimitOnApi } from '@/lib/server/ratelimiter';
import { createDataStreamResponse } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { processChatMessages } from '@/lib/ai/message-utils';
import { postRequestBodySchema, type PostRequestBody } from '../chat/schema';
import { ChatSDKError } from '@/lib/errors';
import { handleInitialChatAndUserMessage } from '@/lib/ai/actions';
import { executeDeepResearchTool } from '@/lib/ai/tools/deep-research';
import { validateChatAccess } from '@/lib/ai/actions/chat-validation';

export const maxDuration = 800;

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
    const userCountryCode = request.headers.get('x-vercel-ip-country');
    const { messages, model, modelParams, chatMetadata } = requestBody;

    const { profile } = await getAIProfile();
    const config = await getProviderConfig(profile.user_id);

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

    const { processedMessages, systemPrompt } = await processChatMessages(
      messages,
      'deep-research-model',
      modelParams,
      profile,
      false,
      supabase,
      true,
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

    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData({
          type: 'ratelimit',
          content: config.rateLimitInfo,
        });

        await executeDeepResearchTool({
          config: {
            chat,
            messages: processedMessages,
            modelParams,
            profile,
            dataStream,
            abortSignal: abortController.signal,
            chatMetadata,
            model,
            userCountryCode,
            originalMessages: messages,
            systemPrompt,
            initialChatPromise,
          },
        });
      },
    });
  } catch (error: any) {
    return handleErrorResponse(error);
  }
}

async function getProviderConfig(user_id: string) {
  const rateLimitStatus = await checkRatelimitOnApi(user_id, 'deep-research');

  return {
    isRateLimitAllowed: rateLimitStatus.allowed,
    rateLimitInfo: rateLimitStatus.info,
    isPremiumUser: rateLimitStatus.info.isPremiumUser,
  };
}
