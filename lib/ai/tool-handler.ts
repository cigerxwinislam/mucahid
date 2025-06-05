import type { Doc } from '@/convex/_generated/dataModel';
import { executeReasonLLMTool } from '@/lib/ai/tools/reason-llm';
import type {
  ChatMetadata,
  BuiltChatMessage,
  LLMID,
  RateLimitInfo,
  ModelParams,
} from '@/types';
import { createDataStreamResponse } from 'ai';

interface ToolHandlerConfig {
  chat: Doc<'chats'> | null;
  messages: BuiltChatMessage[];
  modelParams: ModelParams;
  profile: any;
  isLargeModel: boolean;
  abortSignal: AbortSignal;
  chatMetadata: ChatMetadata;
  model: LLMID;
  isReasoningModel: boolean;
  rateLimitInfo: RateLimitInfo;
  initialChatPromise: Promise<void>;
}

export async function handleToolExecution(config: ToolHandlerConfig) {
  const {
    chat,
    messages,
    modelParams,
    profile,
    isLargeModel,
    abortSignal,
    chatMetadata,
    model,
    isReasoningModel,
    rateLimitInfo,
    initialChatPromise,
  } = config;

  if (isReasoningModel) {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        await executeReasonLLMTool({
          config: {
            chat,
            messages,
            modelParams,
            profile,
            dataStream,
            isLargeModel,
            abortSignal,
            chatMetadata,
            model,
            rateLimitInfo,
            initialChatPromise,
          },
        });
      },
    });
  }

  return null;
}
