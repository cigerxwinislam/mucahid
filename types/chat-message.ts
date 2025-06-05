import type { FilePart, TextPart } from 'ai';
import type { PluginID } from './plugins';
import type { Doc } from '@/convex/_generated/dataModel';

export interface ChatMessage {
  message: Doc<'messages'>;
  fileItems: Doc<'file_items'>[];
  feedback?: Doc<'feedback'>;
  attachments?: Doc<'file_items'>[];
}

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export type MessageContent = ImageContent | TextPart | FilePart;

export interface BuiltChatMessage {
  role: string;
  content: string | MessageContent[];
  attachments?: Doc<'file_items'>[];
}

export interface ProviderMetadata {
  thinking_elapsed_secs?: number | null;
  citations?: string[];
}

export interface MessageModelParams {
  plugin: PluginID;
}
