import type { Id } from '@/convex/_generated/dataModel';
import { CONTINUE_PROMPT } from '@/lib/models/llm-prompting';
import { lastSequenceNumber } from '@/lib/utils';
import type { ChatMessage, LLMID } from '@/types';
import type { PluginID } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const createTempMessages = ({
  messageContent,
  chatMessages,
  b64Images,
  isContinuation,
  selectedPlugin,
  model,
}: {
  messageContent: string | null;
  chatMessages: ChatMessage[];
  b64Images: string[];
  isContinuation: boolean;
  selectedPlugin: PluginID | null;
  model: LLMID;
}) => {
  const messageContentInternal = isContinuation
    ? CONTINUE_PROMPT
    : messageContent || CONTINUE_PROMPT;

  const tempUserChatMessage: ChatMessage = {
    message: {
      _id: uuidv4() as Id<'messages'>,
      _creationTime: Date.now(),
      chat_id: '',
      content: messageContentInternal,
      thinking_content: undefined,
      thinking_elapsed_secs: undefined,
      model,
      plugin: selectedPlugin || undefined,
      role: 'user',
      sequence_number: lastSequenceNumber(chatMessages) + 1,
      updated_at: Date.now(),
      id: uuidv4(),
      image_paths: b64Images,
      user_id: '',
      citations: [],
      attachments: [],
    },
    fileItems: [],
  };

  const tempAssistantChatMessage: ChatMessage = {
    message: {
      _id: uuidv4() as Id<'messages'>,
      _creationTime: Date.now(),
      chat_id: '',
      content: '',
      thinking_content: undefined,
      thinking_elapsed_secs: undefined,
      model,
      plugin: selectedPlugin || undefined,
      role: 'assistant',
      sequence_number: lastSequenceNumber(chatMessages) + 2,
      updated_at: Date.now(),
      id: uuidv4(),
      image_paths: [],
      user_id: '',
      citations: [],
      attachments: [],
    },
    fileItems: [],
  };

  return {
    tempUserChatMessage,
    tempAssistantChatMessage,
  };
};
