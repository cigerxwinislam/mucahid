import { useChatHandler } from '@/components/chat/chat-hooks/use-chat-handler';
import { PentestGPTContext } from '@/context/context';
import type { Doc } from '@/convex/_generated/dataModel';
import { type FC, useContext, useState } from 'react';
import { Message } from '../messages/message';
import type { ChatMessage } from '@/types';

export const ChatMessages: FC = () => {
  const { chatMessages, temporaryChatMessages, isTemporaryChat } =
    useContext(PentestGPTContext);

  const { handleSendEdit, handleSendFeedback } = useChatHandler();

  const onSendFeedback = (
    chatMessage: ChatMessage,
    feedback: 'good' | 'bad',
    reason?: string,
    detailedFeedback?: string,
    allowSharing?: boolean,
    allowEmail?: boolean,
  ) => {
    handleSendFeedback(
      chatMessage,
      feedback,
      reason,
      detailedFeedback,
      allowSharing,
      allowEmail,
    );
  };

  const [editingMessage, setEditingMessage] = useState<Doc<'messages'>>();

  const messagesToDisplay = isTemporaryChat
    ? temporaryChatMessages
    : chatMessages;

  return (
    <>
      {messagesToDisplay.map((chatMessage, index) => {
        const previousMessage =
          index > 0 ? messagesToDisplay[index - 1].message : undefined;
        return (
          <Message
            key={chatMessage.message.id}
            chatMessage={chatMessage}
            previousMessage={previousMessage}
            isEditing={editingMessage?.id === chatMessage.message.id}
            isLastMessage={index === messagesToDisplay.length - 1}
            onStartEdit={setEditingMessage}
            onCancelEdit={() => setEditingMessage(undefined)}
            onSubmitEdit={handleSendEdit}
            onSendFeedback={(
              feedback: 'good' | 'bad',
              reason?: string,
              detailedFeedback?: string,
              allowSharing?: boolean,
              allowEmail?: boolean,
            ) =>
              onSendFeedback(
                chatMessage,
                feedback,
                reason,
                detailedFeedback,
                allowSharing,
                allowEmail,
              )
            }
          />
        );
      })}
    </>
  );
};
