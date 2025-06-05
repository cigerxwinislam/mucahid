import { useChatHandler } from '@/components/chat/chat-hooks/use-chat-handler';
import { PentestGPTContext } from '@/context/context';
import { cn } from '@/lib/utils';
import type { Doc } from '@/convex/_generated/dataModel';
import type { ChatMessage, LLMID, MessageImage } from '@/types';
import Image from 'next/image';
import {
  type FC,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button } from '../ui/button';
import { TextareaAutosize } from '../ui/textarea-autosize';
import { MessageActions } from './message-actions';
import MessageDetailedFeedback from './message-detailed-feedback';
import { MessageQuickFeedback } from './message-quick-feedback';
import { MessageTypeResolver } from './message-type-solver';
import useHotkey from '@/lib/hooks/use-hotkey';
import { toast } from 'sonner';
import { LoadingState } from './loading-states';
import dynamic from 'next/dynamic';
import { useUIContext } from '@/context/ui-context';
import { ChatFileItem } from '../chat/chat-file-item';
import { AgentStatus } from './agent-status';
import { MessageStatus } from './message-status';
import { MessageAttachments } from './message-attachments';

const DynamicFilePreview = dynamic(() => import('../ui/file-preview'), {
  ssr: false,
});

interface MessageProps {
  chatMessage: ChatMessage;
  previousMessage: Doc<'messages'> | undefined;
  isEditing: boolean;
  isLastMessage: boolean;
  onStartEdit: (message: Doc<'messages'>) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (value: string, sequenceNumber: number) => void;
  onSendFeedback: (
    feedback: 'good' | 'bad',
    reason?: string,
    detailedFeedback?: string,
    allowSharing?: boolean,
    allowEmail?: boolean,
  ) => void;
}

export const Message: FC<MessageProps> = ({
  chatMessage,
  previousMessage,
  isEditing,
  isLastMessage,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onSendFeedback,
}) => {
  const {
    chatMessages,
    temporaryChatMessages,
    isTemporaryChat,
    chatImages,
    chatFiles,
    selectedChat,
  } = useContext(PentestGPTContext);

  const { setIsGenerating, toolInUse, isMobile } = useUIContext();

  const { message, feedback } = chatMessage;

  const messagesToDisplay = isTemporaryChat
    ? temporaryChatMessages
    : chatMessages;

  const { handleSendMessage } = useChatHandler();

  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);

  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);

  const [showFileItemPreview, setShowFileItemPreview] = useState(false);
  const [selectedFileItem, setSelectedFileItem] =
    useState<Doc<'file_items'> | null>(null);

  const [quickFeedback, setQuickFeedback] = useState(false);
  const [sendReportQuery, setSendReportQuery] = useState(false);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const files = chatFiles.filter((file) => file.message_id === message.id);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  useHotkey('c', () => {
    if (isLastMessage && message.role === 'assistant') {
      handleCopy();
      toast.success('Last response copied to clipboard', {
        duration: 3000,
      });
    }
  });

  const handleSendEdit = () => {
    onSubmitEdit(editedMessage, message.sequence_number);
    onCancelEdit();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === 'Enter' && event.metaKey) {
      handleSendEdit();
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);

    await handleSendMessage(
      editedMessage ||
        messagesToDisplay[messagesToDisplay.length - 2].message.content,
      messagesToDisplay,
      true,
    );
  };

  const handleRegenerateSpecificModel = async (model: string) => {
    setIsGenerating(true);

    await handleSendMessage(
      editedMessage ||
        messagesToDisplay[messagesToDisplay.length - 2].message.content,
      messagesToDisplay,
      true,
      false,
      undefined,
      model as LLMID,
    );
  };

  const handleGoodResponse = async () => {
    if (feedback?.feedback !== 'good') {
      onSendFeedback('good', '', '', false, false);
    }
  };

  const handleReportModal = async () => {
    setSendReportQuery(false);
    setIsFeedbackDialogOpen(true);
  };

  const handleBadResponseReason = async (reason: string) => {
    if (feedback?.feedback !== 'bad' || feedback?.reason !== reason) {
      onSendFeedback('bad', reason, '', false, false);
    }
    setQuickFeedback(false);
    setSendReportQuery(true);
  };

  const handleBadResponse = async () => {
    if (feedback?.feedback !== 'bad') {
      onSendFeedback('bad', '', '', false, false);
    }
    setQuickFeedback(true);
  };

  useEffect(() => {
    if (quickFeedback) {
      const feedbackElement = document.querySelector('.quick-feedback');
      if (feedbackElement) {
        feedbackElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [quickFeedback]);

  const handleStartEdit = () => {
    onStartEdit(message);
  };

  useEffect(() => {
    setEditedMessage(message.content);

    if (isEditing && editInputRef.current) {
      const input = editInputRef.current;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [isEditing]);

  return (
    <div
      className={cn('flex w-full justify-center')}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`relative flex w-full flex-col px-4 py-6 sm:max-w-[800px] sm:px-6 md:px-8
        ${isLastMessage ? 'mb-8' : ''}`}
      >
        <div className="flex space-x-3">
          <div
            className={`grow ${isMobile && 'space-y-3'} min-w-0 ${message.role === 'user' && 'flex justify-end'}`}
          >
            <LoadingState
              isLastMessage={isLastMessage}
              isAssistant={message.role === 'assistant'}
            />

            {isEditing ? (
              <div className="flex h-auto w-full flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <ChatFileItem
                      key={index}
                      file={file}
                      showRemoveButton={false}
                    />
                  ))}
                </div>

                <TextareaAutosize
                  textareaRef={editInputRef as RefObject<HTMLTextAreaElement>}
                  className="text-md w-full"
                  maxRows={isMobile ? 8 : 10}
                  value={editedMessage}
                  onValueChange={setEditedMessage}
                />
              </div>
            ) : (
              <div>
                <div className="mb-2 flex flex-col items-end gap-2">
                  {files.map((file, index) => (
                    <ChatFileItem
                      key={index}
                      file={file}
                      showRemoveButton={false}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {message.image_paths.map((path, index) => {
                    const item = chatImages.find(
                      (image) => image.path === path,
                    );
                    const src = path.startsWith('data') ? path : item?.base64;
                    if (!src) return null;
                    return (
                      <Image
                        key={index}
                        className="mb-2 cursor-pointer rounded hover:opacity-50"
                        src={src}
                        alt="message image"
                        width={400}
                        height={400}
                        onClick={() => {
                          setSelectedImage({
                            messageId: message.id,
                            path,
                            base64: src,
                            url: path.startsWith('data') ? '' : item?.url || '',
                            file: null,
                          });
                          setShowImagePreview(true);
                        }}
                        loading="lazy"
                      />
                    );
                  })}
                </div>

                <MessageTypeResolver
                  message={message}
                  isLastMessage={isLastMessage}
                  toolInUse={toolInUse}
                />

                <MessageAttachments
                  attachments={message.attachments || []}
                  isAssistant={message.role === 'assistant'}
                />
              </div>
            )}

            <AgentStatus
              isLastMessage={isLastMessage}
              isAssistant={message.role === 'assistant'}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" />

        {isEditing && (
          <div className="mt-2 flex justify-end space-x-2">
            <Button size="sm" variant="secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendEdit}>
              Send
            </Button>
          </div>
        )}

        <MessageStatus
          isLastMessage={isLastMessage}
          isAssistant={message.role === 'assistant'}
          finish_reason={selectedChat?.finish_reason}
        />

        {!quickFeedback && !sendReportQuery && !isEditing && (
          <div
            className={`absolute bottom-1 ${message.role === 'user' ? 'right-5 sm:right-8' : 'left-5 sm:left-8'}`}
          >
            <MessageActions
              onCopy={handleCopy}
              onEdit={handleStartEdit}
              isAssistant={message.role === 'assistant'}
              isLastMessage={isLastMessage}
              isEditing={isEditing}
              isHovering={isHovering}
              isGoodResponse={feedback?.feedback === 'good'}
              isBadResponse={feedback?.feedback === 'bad'}
              messageHasImage={message.image_paths.length > 0}
              onRegenerate={handleRegenerate}
              onRegenerateSpecificModel={handleRegenerateSpecificModel}
              onGoodResponse={handleGoodResponse}
              onBadResponse={handleBadResponse}
              messageContent={message.content || ''}
              messageModel={message.model}
            />
          </div>
        )}

        {quickFeedback && (
          <MessageQuickFeedback
            handleBadResponseReason={handleBadResponseReason}
            feedback={feedback}
          />
        )}

        {sendReportQuery && (
          <div className="rounded-lg border p-4 shadow-lg">
            <p className="mb-2">Would you like to tell us more details?</p>
            <div className="flex flex-row flex-wrap items-start gap-2">
              <Button variant="outline" size="sm" onClick={handleReportModal}>
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSendReportQuery(false)}
              >
                No
              </Button>
            </div>
          </div>
        )}
      </div>

      {showImagePreview && selectedImage && (
        <DynamicFilePreview
          type="image"
          item={selectedImage}
          isOpen={showImagePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowImagePreview(isOpen);
            setSelectedImage(null);
          }}
        />
      )}

      {showFileItemPreview && selectedFileItem && (
        <DynamicFilePreview
          type="file_item"
          item={selectedFileItem}
          isOpen={showFileItemPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFileItemPreview(isOpen);
            setSelectedFileItem(null);
          }}
        />
      )}

      <MessageDetailedFeedback
        isOpen={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
        feedback={feedback as Doc<'feedback'>}
        onSendFeedback={onSendFeedback}
      />
    </div>
  );
};
