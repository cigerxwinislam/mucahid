import type { BuiltChatMessage, ChatMessage, ChatPayload } from '@/types';
import { countTokens } from 'gpt-tokenizer';
import { toast } from 'sonner';

// Helper function to find the last user message
function findLastUserMessage(
  chatMessages: ChatMessage[],
): ChatMessage | undefined {
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    if (chatMessages[i].message.role === 'user') {
      return chatMessages[i];
    }
  }
  return undefined;
}

export async function buildFinalMessages(
  payload: ChatPayload,
  isPremiumSubscription = false,
): Promise<BuiltChatMessage[]> {
  const { chatMessages, retrievedFileItems, imagePaths } = payload;
  const CONTEXT_WINDOW = isPremiumSubscription ? 32000 : 8000;

  let remainingTokens = CONTEXT_WINDOW;

  // Find the last user message
  const lastUserMessage = findLastUserMessage(chatMessages);
  if (!lastUserMessage) {
    throw new Error('No user message found in chat');
  }

  const lastUserMessageContent = Array.isArray(lastUserMessage.message.content)
    ? lastUserMessage.message.content
        .map((item) => (item.type === 'text' ? item.text : ''))
        .join(' ')
    : lastUserMessage.message.content;
  const lastUserMessageTokens = countTokens(lastUserMessageContent);

  if (lastUserMessageTokens > CONTEXT_WINDOW) {
    const errorMessage =
      'The message you submitted was too long, please submit something shorter.';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  const truncatedMessages: any[] = [];

  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const message = chatMessages[i].message;
    const fileItems = chatMessages[i].fileItems;
    const isLastUserMessage = chatMessages[i] === lastUserMessage;

    let messageTokens = countTokens(message.content);

    // Add tokens from file items if they exist
    if (fileItems && fileItems.length > 0) {
      const fileTokens = fileItems.reduce(
        (acc, item) => acc + (item.tokens || 0),
        0,
      );
      messageTokens += fileTokens;
    }

    // Add tokens from retrieved file items for the last user message
    if (
      isLastUserMessage &&
      retrievedFileItems &&
      retrievedFileItems.length > 0
    ) {
      const retrievedTokens = retrievedFileItems.reduce(
        (acc, item) => acc + (item.tokens || 0),
        0,
      );
      messageTokens += retrievedTokens;
    }

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens;
      truncatedMessages.unshift({
        ...message,
        // Consolidate and deduplicate attachments from both sources
        ...(() => {
          const baseAttachments = (fileItems ?? []).map((fi) => ({
            file_id: fi.file_id,
          }));
          const retrievedAttachments =
            isLastUserMessage && retrievedFileItems
              ? retrievedFileItems.map((ri) => ({ file_id: ri.file_id }))
              : [];

          const uniqueAttachments = Array.from(
            new Map(
              [...baseAttachments, ...retrievedAttachments].map((obj) => [
                obj.file_id,
                obj,
              ]),
            ).values(),
          );

          return uniqueAttachments.length
            ? { attachments: uniqueAttachments }
            : {};
        })(),
      });
    } else {
      break;
    }
  }

  if (truncatedMessages.length === 1) {
    const errorMessage =
      'The message and its files are too large to process. Please reduce the file size or content.';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  const finalMessages: BuiltChatMessage[] = truncatedMessages.map((message) => {
    let content;

    if (
      message.image_paths &&
      message.image_paths.length > 0 &&
      message.role !== 'assistant'
    ) {
      // Check if this message matches the last user message (where temp images are)
      const isLastUserMessageWithTempImages =
        message.id === lastUserMessage.message.id &&
        imagePaths &&
        imagePaths.length > 0;

      const imagePathsToUse = isLastUserMessageWithTempImages
        ? imagePaths
        : message.image_paths;

      content = [
        {
          type: 'text',
          text: message.content,
        },
        ...imagePathsToUse.map((path: string) => ({
          type: 'image_url' as const,
          image_url: {
            url: path,
            isPath: true,
          },
        })),
      ];
    } else {
      content = message.content;
    }

    return {
      role: message.role,
      content,
      ...(message.attachments ? { attachments: message.attachments } : {}),
    };
  });

  return finalMessages;
}
