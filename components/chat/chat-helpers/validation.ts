import type { ChatSettings, LLM } from '@/types';
import type { Doc } from '@/convex/_generated/dataModel';

export const validateChatSettings = (
  chatSettings: ChatSettings | null,
  modelData: LLM | undefined,
  profile: Doc<'profiles'> | null,
  isContinuation: boolean,
  messageContent: string | null,
) => {
  if (!chatSettings) throw new Error('Chat settings not found');
  if (!modelData) throw new Error('Model not found');
  if (!profile) throw new Error('Profile not found');
  if (!isContinuation && !messageContent)
    throw new Error('Message content not found');
};
