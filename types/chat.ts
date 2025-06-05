import type { ChatMessage, LLMID } from '.';
import type { Doc } from '../convex/_generated/dataModel';

export interface ChatSettings {
  model: LLMID;
}

export interface ChatPayload {
  chatMessages: ChatMessage[];
  retrievedFileItems: Doc<'file_items'>[];
  imagePaths?: string[]; // List of image paths to be processed
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings;
  messages: Doc<'messages'>[];
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user' | 'system';

export type SubscriptionStatus = 'free' | 'pro' | 'team';

export type ChatMetadata = {
  id?: string;
  retrievedFileItems?: Doc<'file_items'>[];
};
