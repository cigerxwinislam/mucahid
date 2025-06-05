import { extractTextContent } from './message-utils';
import type {
  LLMID,
  ChatMetadata,
  ModelParams,
  BuiltChatMessage,
} from '@/types';
import {
  saveUserMessage,
  saveAssistantMessage,
} from './actions/message-actions';
import { createChat, updateChat } from './actions/chat-actions';
import { generateObject } from 'ai';
import { myProvider } from './providers';
import { DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE } from './prompts';
import { z } from 'zod';
import type { Doc } from '@/convex/_generated/dataModel';

export async function handleInitialChatAndUserMessage({
  modelParams,
  chatMetadata,
  profile,
  model,
  chat,
  messages,
}: {
  modelParams: ModelParams;
  chatMetadata: ChatMetadata;
  profile: { user_id: string };
  model: LLMID;
  chat: Doc<'chats'> | null;
  messages: any[];
}) {
  if (!chatMetadata.id) return;

  const content = extractTextContent(messages[messages.length - 1].content);

  if (!chat) {
    await createChat({
      chatId: chatMetadata.id,
      userId: profile.user_id,
      model,
      content,
      finishReason: 'stop', // Initial finish reason
    });
  }

  await saveUserMessage({
    chatId: chatMetadata.id,
    userId: profile.user_id,
    messages,
    modelParams,
    model,
    editSequenceNumber: modelParams.editSequenceNumber,
    retrievedFileItems: chatMetadata.retrievedFileItems,
  });
}

export async function handleFinalChatAndAssistantMessage({
  modelParams,
  chatMetadata,
  profile,
  model,
  chat,
  finishReason,
  title,
  assistantMessage,
  citations,
  thinkingText,
  thinkingElapsedSecs,
  fileAttachments,
  assistantMessageId,
}: {
  modelParams: ModelParams;
  chatMetadata: ChatMetadata;
  profile: { user_id: string };
  model: LLMID;
  chat: Doc<'chats'> | null;
  finishReason: string;
  title?: string;
  assistantMessage?: string;
  citations?: string[];
  thinkingText?: string;
  thinkingElapsedSecs?: number | null;
  fileAttachments?: any[];
  assistantMessageId?: string;
}) {
  if (!chatMetadata.id) return;

  await updateChat({
    chatId: chatMetadata.id,
    model,
    title,
    finishReason,
    newChat: !chat,
  });

  await saveAssistantMessage({
    chatId: chatMetadata.id,
    userId: profile.user_id,
    modelParams,
    model,
    editSequenceNumber: modelParams.editSequenceNumber,
    assistantMessage,
    citations,
    thinkingText,
    thinkingElapsedSecs,
    fileAttachments,
    assistantMessageId,
  });
}

export async function generateTitleFromUserMessage({
  messages,
  abortSignal,
}: {
  messages: BuiltChatMessage[];
  abortSignal: AbortSignal;
}) {
  try {
    const message =
      messages.find((m: { role: string }) => m.role === 'user') ||
      messages[messages.length - 1];
    const textContent = extractTextContent(message.content);

    const {
      object: { title },
    } = await generateObject({
      model: myProvider.languageModel('chat-model-small'),
      schema: z.object({
        title: z.string().describe('The generated title (3-5 words)'),
      }),
      messages: [
        {
          role: 'user',
          content: DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE(textContent),
        },
      ],
      abortSignal,
      maxTokens: 50,
    });

    return title;
  } catch (error) {
    console.error('[Title Generation] Error:', error);
    // Return a fallback title based on the first message content
    const message =
      messages.find((m: { role: string }) => m.role === 'user') ||
      messages[messages.length - 1];
    const textContent = extractTextContent(message.content);
    return textContent.substring(0, 100).trim();
  }
}
