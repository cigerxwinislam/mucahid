// Only used in use-chat-handler.tsx to keep it clean

import type { AlertAction } from '@/context/alert-context';
import { buildFinalMessages } from '@/lib/build-prompt';
import type {
  ChatMessage,
  ChatPayload,
  ModelParams,
  LLMID,
  ChatMetadata,
} from '@/types';
import { PluginID } from '@/types';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { processResponse } from './stream-processor';
import type { AgentStatusState } from '@/components/messages/agent-status';
import type { Doc, Id } from '@/convex/_generated/dataModel';

export * from './create-messages';
export * from './create-temp-messages';
export * from './validation';

export const handleHostedChat = async (
  payload: ChatPayload,
  tempAssistantChatMessage: ChatMessage,
  isRegeneration: boolean,
  newAbortController: AbortController,
  setIsGenerating: Dispatch<SetStateAction<boolean>>,
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>,
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setToolInUse: Dispatch<SetStateAction<string>>,
  alertDispatch: Dispatch<AlertAction>,
  setAgentStatus: Dispatch<SetStateAction<AgentStatusState | null>>,
  model: LLMID,
  modelParams: ModelParams,
  chatMetadata: ChatMetadata,
  isPremiumSubscription: boolean,
) => {
  let apiEndpoint = '/api/chat';

  if (
    modelParams.confirmTerminalCommand ||
    modelParams.isTerminalContinuation ||
    modelParams.selectedPlugin === PluginID.PENTEST_AGENT
  ) {
    apiEndpoint = '/api/agent';
  } else if (modelParams.selectedPlugin === PluginID.DEEP_RESEARCH) {
    apiEndpoint = '/api/tasks';
  }

  const formattedMessages = await buildFinalMessages(
    payload,
    isPremiumSubscription,
  );

  const requestBody = {
    messages: formattedMessages,
    model,
    modelParams,
    chatMetadata,
  };

  const chatResponse = await fetchChatResponse(
    apiEndpoint,
    requestBody,
    newAbortController,
    setIsGenerating,
    setChatMessages,
    alertDispatch,
    isRegeneration,
  );

  const lastMessage =
    isRegeneration || modelParams.isContinuation
      ? payload.chatMessages[
          payload.chatMessages.length - (modelParams.isContinuation ? 2 : 1)
        ]
      : tempAssistantChatMessage;

  return processResponse(
    chatResponse,
    lastMessage,
    newAbortController,
    setFirstTokenReceived,
    setChatMessages,
    setToolInUse,
    setIsGenerating,
    alertDispatch,
    modelParams.selectedPlugin,
    modelParams.isContinuation,
    setAgentStatus,
    requestBody,
  );
};

export const fetchChatResponse = async (
  apiEndpoint: string,
  body: object,
  controller: AbortController,
  setIsGenerating: Dispatch<SetStateAction<boolean>>,
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  alertDispatch: Dispatch<AlertAction>,
  isRegeneration: boolean,
) => {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    if (response.status === 500) {
      toast.error(errorData.message || 'Server error');
    } else if (
      response.status === 429 &&
      errorData.error?.type === 'ratelimit_hit'
    ) {
      alertDispatch({
        type: 'SHOW',
        payload: {
          message: errorData.error.message,
          title: 'Usage Cap Error',
          ...(errorData.error.isPremiumUser === false && {
            action: {
              label: 'Upgrade Now',
              onClick: () => {
                window.location.href = '/upgrade';
              },
            },
          }),
        },
      });
    } else {
      console.error(
        `[Frontend] [${response.status}] Error in fetchChatResponse:`,
        errorData.message || 'An error occurred',
      );
      toast.error(errorData.message || 'An error occurred');
    }

    setIsGenerating(false);
    if (!isRegeneration) {
      setChatMessages((prevMessages) => prevMessages.slice(0, -2));
    }
  }

  return response;
};

export const handleCreateChat = async (
  model: LLMID,
  profile: Doc<'profiles'>,
  messageContent: string,
  finishReason: string,
  setSelectedChat: Dispatch<SetStateAction<Doc<'chats'> | null>>,
  setChats: Dispatch<SetStateAction<Doc<'chats'>[]>>,
  chatId: string,
  chatTitle?: string | null,
) => {
  const createdChat = {
    _id: chatId as Id<'chats'>,
    _creationTime: Date.now(),
    id: chatId,
    user_id: profile.user_id,
    model,
    name: chatTitle || messageContent.substring(0, 100),
    finish_reason: finishReason,
    updated_at: Date.now(),
    last_shared_message_id: undefined,
    shared_at: undefined,
    shared_by: undefined,
    sharing: 'private' as const,
  };

  setSelectedChat(createdChat);
  setChats((chats) => [createdChat, ...chats]);

  return createdChat;
};
