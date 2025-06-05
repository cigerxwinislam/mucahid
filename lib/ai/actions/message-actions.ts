import type { LLMID, BuiltChatMessage, ModelParams } from '@/types';
import { extractTextContent } from '../message-utils';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { v4 as uuidv4 } from 'uuid';
import type { Doc, Id } from '@/convex/_generated/dataModel';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Find the last message with role 'user'
export function getLastUserMessage(
  messages: BuiltChatMessage[],
): BuiltChatMessage | null {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user');
  return lastUserMessage || null;
}

export async function saveUserMessage({
  chatId,
  userId,
  messages,
  modelParams,
  model,
  editSequenceNumber,
  retrievedFileItems,
}: {
  chatId: string;
  userId: string;
  messages: BuiltChatMessage[];
  modelParams: ModelParams;
  model: LLMID;
  editSequenceNumber?: number;
  retrievedFileItems?: Doc<'file_items'>[];
}): Promise<void> {
  // If regeneration, delete the last message
  if (modelParams.isRegeneration) {
    const { success: deleteSuccess, error: deleteError } =
      await convex.mutation(api.messages.deleteLastMessage, {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        chatId,
      });

    if (!deleteSuccess) {
      console.error('Error deleting last message:', deleteError);
    }
  }

  // Check if we should save the user message
  const shouldSaveUserMessage =
    !modelParams.isContinuation &&
    !modelParams.isTerminalContinuation &&
    !modelParams.isRegeneration;

  if (!shouldSaveUserMessage) {
    return;
  }

  // If editing, handle file operations and delete messages after the edited sequence
  if (editSequenceNumber !== undefined) {
    // Update files associated with the edited message
    const { success: fileSuccess, error: fileError } = await convex.mutation(
      api.files.retrieveAndUpdateFilesForMessage,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        chatId,
        sequenceNumber: editSequenceNumber,
      },
    );

    if (!fileSuccess) {
      console.error('Error handling files during message edit:', fileError);
      // Continue with message deletion even if file handling fails
    }

    // Then delete messages after the edited sequence
    const deleteResult = await convex.mutation(
      api.messages.deleteMessagesIncludingAndAfter,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        chatId,
        sequenceNumber: editSequenceNumber,
      },
    );

    if (!deleteResult.success) {
      console.error('Error deleting messages:', deleteResult.error);
      throw new Error(deleteResult.error || 'Failed to delete messages');
    }
  }

  const lastUserMessage = getLastUserMessage(messages);
  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  const content = extractTextContent(lastUserMessage.content);
  const sequence =
    editSequenceNumber ??
    (await convex.query(api.messages.getNextMessageSequence, { chatId }));

  // Extract image paths before creating message
  const imageContents = Array.isArray(lastUserMessage.content)
    ? lastUserMessage.content.filter((item) => item.type === 'image_url')
    : [];

  const imagePaths = imageContents.map(
    (imageContent) => imageContent.image_url.url,
  );

  const userMessageData = {
    id: uuidv4(),
    chat_id: chatId,
    user_id: userId,
    content,
    thinking_content: undefined,
    thinking_elapsed_secs: undefined,
    model,
    plugin: modelParams.selectedPlugin || undefined,
    role: 'user',
    sequence_number: sequence,
    image_paths: imagePaths,
    citations: [],
    attachments: [],
  };

  const insertResult = await convex.mutation(api.messages.insertMessage, {
    serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
    message: userMessageData,
  });

  if (!insertResult.success) {
    console.error('Error inserting message:', insertResult.error);
    throw new Error(insertResult.error || 'Failed to insert message');
  }

  const savedUserMessageId = insertResult.messageId;

  // Handle image relationships
  if (savedUserMessageId) {
    // Handle file updates if there are any
    const fileAttachments = lastUserMessage.attachments || [];
    if (fileAttachments.length > 0) {
      const fileIds = fileAttachments
        .map((attachment) => attachment.file_id)
        .filter((id): id is Id<'files'> => id !== undefined);

      if (fileIds.length > 0) {
        const updateResult = await convex.mutation(
          api.files.updateFilesMessage,
          {
            serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
            fileIds,
            messageId: savedUserMessageId,
            chatId: chatId,
          },
        );

        if (!updateResult.success) {
          console.error('Error updating files:', {
            error: updateResult.error,
            messageId: savedUserMessageId,
            chatId: chatId,
          });
        }
      }
    }

    // Handle file items if there are any
    if (retrievedFileItems && retrievedFileItems.length > 0) {
      const fileItemsSuccess = await convex.mutation(
        api.file_items.updateFileItemsWithMessage,
        {
          serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
          fileItems: retrievedFileItems.map((item) => ({
            _id: item._id,
            file_id: item.file_id,
            user_id: item.user_id,
            content: item.content,
            tokens: item.tokens,
            name: item.name,
            sequence_number: item.sequence_number,
          })),
          messageId: savedUserMessageId,
          chatId,
          userId,
        },
      );

      if (!fileItemsSuccess) {
        console.error('Error updating file items with message relationships');
      }
    }
  }
}

export async function saveAssistantMessage({
  chatId,
  userId,
  modelParams,
  model,
  editSequenceNumber,
  assistantMessage,
  citations,
  thinkingText,
  thinkingElapsedSecs,
  fileAttachments,
  assistantMessageId,
}: {
  chatId: string;
  userId: string;
  modelParams: ModelParams;
  model: LLMID;
  editSequenceNumber?: number;
  assistantMessage?: string;
  citations?: string[];
  thinkingText?: string;
  thinkingElapsedSecs?: number | null;
  fileAttachments?: any[];
  assistantMessageId?: string;
}): Promise<void> {
  // When editing messages, we need to increment the sequence number by 1
  // to ensure the assistant's response appears after the edited message
  const adjustedSequenceNumber = editSequenceNumber
    ? editSequenceNumber + 1
    : undefined;

  const result = await convex.mutation(api.messages.saveAssistantMessage, {
    serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
    chatId,
    userId,
    content: assistantMessage || '',
    model,
    plugin: modelParams.selectedPlugin,
    thinkingContent: thinkingText,
    thinkingElapsedSecs: thinkingElapsedSecs || undefined,
    thinkingEnabled: model === 'reasoning-model',
    citations: citations || [],
    attachments: fileAttachments || [],
    isContinuation: modelParams.isContinuation,
    isTerminalContinuation: modelParams.isTerminalContinuation,
    editSequenceNumber: adjustedSequenceNumber,
    assistantMessageId,
  });

  if (!result.success) {
    console.error('Error saving assistant message:', result.error);
    throw new Error(result.error || 'Failed to save assistant message');
  }
}
