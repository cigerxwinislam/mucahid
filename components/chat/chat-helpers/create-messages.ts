import { lastSequenceNumber } from '@/lib/utils';
import type {
  ChatMessage,
  LLM,
  MessageImage,
  FileAttachment,
  PluginID,
} from '@/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { convertToJsonAttachments } from '@/lib/utils/type-converters';
import type { Doc, Id } from '@/convex/_generated/dataModel';

export const handleCreateMessages = async (
  chatMessages: ChatMessage[],
  currentChat: Doc<'chats'> | null,
  profile: Doc<'profiles'>,
  modelData: LLM,
  messageContent: string | null,
  generatedText: string,
  newMessageImages: MessageImage[],
  isRegeneration: boolean,
  isContinuation: boolean,
  retrievedFileItems: Doc<'file_items'>[],
  setMessages: (messages: ChatMessage[]) => void,
  setChatImages: React.Dispatch<React.SetStateAction<MessageImage[]>>,
  selectedPlugin: PluginID,
  editSequenceNumber?: number,
  isTemporary = false,
  citations?: string[],
  thinkingText?: string,
  thinkingElapsedSecs?: number | null,
  newChatFiles?: { _id: Id<'files'> }[],
  setChatFiles?: React.Dispatch<React.SetStateAction<Doc<'files'>[]>>,
  fileAttachments?: FileAttachment[],
  assistantMessageId?: string | null,
) => {
  try {
    const isEdit = editSequenceNumber !== undefined;

    const userMessage: ChatMessage = {
      message: {
        _id: uuidv4() as Id<'messages'>,
        _creationTime: Date.now(),
        id: isEdit
          ? chatMessages.find(
              (msg) => msg.message.sequence_number === editSequenceNumber,
            )?.message.id || uuidv4()
          : uuidv4(),
        chat_id: currentChat?.id || '',
        content: messageContent || '',
        thinking_content: undefined,
        thinking_elapsed_secs: undefined,
        role: 'user',
        model: modelData.modelId,
        plugin: selectedPlugin,
        updated_at: Date.now(),
        sequence_number: lastSequenceNumber(chatMessages) + 1,
        user_id: profile.user_id,
        image_paths: newMessageImages.map((image) => image.path),
        attachments: [],
        citations: [],
      },
      fileItems: isEdit
        ? chatMessages.find(
            (msg) => msg.message.sequence_number === editSequenceNumber,
          )?.fileItems || []
        : retrievedFileItems,
    };

    const assistantMessage: ChatMessage = {
      message: {
        _id: uuidv4() as Id<'messages'>,
        _creationTime: Date.now(),
        id: assistantMessageId || uuidv4(),
        chat_id: currentChat?.id || '',
        content: generatedText,
        thinking_content: thinkingText || undefined,
        thinking_elapsed_secs: thinkingElapsedSecs || undefined,
        model: modelData.modelId,
        plugin: selectedPlugin,
        role: 'assistant',
        updated_at: Date.now(),
        sequence_number: lastSequenceNumber(chatMessages) + 2,
        user_id: profile.user_id,
        image_paths: [],
        citations: citations || [],
        attachments: fileAttachments
          ? convertToJsonAttachments(fileAttachments)
          : [],
      },
      fileItems: [],
    };

    // If it's a temporary chat, just update UI state
    if (isTemporary || !currentChat) {
      setMessages([...chatMessages, userMessage, assistantMessage]);
      return;
    }

    let finalChatMessages: ChatMessage[] = [];

    if (isRegeneration) {
      finalChatMessages = [...chatMessages.slice(0, -1), assistantMessage];
    } else if (isContinuation) {
      // For continuation, update the last message
      const lastMessage = chatMessages[chatMessages.length - 1];
      const updatedMessage = {
        ...lastMessage,
        message: {
          ...lastMessage.message,
          content: lastMessage.message.content + generatedText,
          attachments: [
            ...(lastMessage.message.attachments || []),
            ...(fileAttachments
              ? convertToJsonAttachments(fileAttachments)
              : []),
          ],
        },
      };
      finalChatMessages = [...chatMessages.slice(0, -1), updatedMessage];
    } else {
      const fileIds = newChatFiles
        ? newChatFiles.map((file) => file._id).filter((id) => id !== undefined)
        : [];

      if (fileIds.length > 0) {
        if (setChatFiles) {
          setChatFiles((prev) =>
            prev.map((file) =>
              fileIds.includes(file._id)
                ? { ...file, message_id: userMessage.message.id }
                : file,
            ),
          );
        }
      }

      const newImages = newMessageImages.map((obj) => ({
        ...obj,
        messageId: userMessage.message.id,
        path: obj.path,
      }));

      setChatImages((prevImages) => [...prevImages, ...newImages]);

      finalChatMessages = [
        ...(isEdit
          ? chatMessages.filter(
              (chatMessage) =>
                chatMessage.message.sequence_number < editSequenceNumber,
            )
          : chatMessages),
        userMessage,
        assistantMessage,
      ];
    }

    setMessages(finalChatMessages);
  } catch (error: any) {
    console.error('Error in handleCreateMessages:', error);
    toast.error('Error updating chat messages. Please try again.');
  }
};
