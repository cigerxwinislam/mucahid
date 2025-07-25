import { PentestGPTContext } from '@/context/context';
import useHotkey from '@/lib/hooks/use-hotkey';
import { cn } from '@/lib/utils';
import { PluginID } from '@/types/plugins';
import {
  type FC,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Input } from '../ui/input';
import { TextareaAutosize } from '../ui/textarea-autosize';
import { ChatFilesDisplay } from './chat-files-display';
import { handleFileUpload } from './chat-helpers/file-upload';
import { useChatHandler } from './chat-hooks/use-chat-handler';
import { usePromptAndCommand } from './chat-hooks/use-prompt-and-command';
import { useSelectFileHandler } from './chat-hooks/use-select-file-handler';
import { UnsupportedFilesDialog } from './unsupported-files-dialog';
import { ToolOptions } from './chat-tools/tool-options';
import { useUIContext } from '@/context/ui-context';
import { useKeyboardHandler } from './chat-hooks/use-key-handler';
import { ChatSendButton } from './chat-send-button';
import { useMessageHandler } from './chat-hooks/use-message-handler';
import { ChatMicButton } from './chat-mic-button';
import useVoiceRecording from './chat-hooks/use-voice-recorder';
import VoiceStatusBar from '@/components/ui/voice-status-bar';
import ChatStarters from './chat-starters';

export const ChatInput: FC = () => {
  useHotkey('l', () => {
    handleFocusChatInput();
  });

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showConfirmationDialog, setShowConfirmationDialog] =
    useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const divRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    userInput,
    chatMessages,
    temporaryChatMessages,
    newMessageImages,
    newMessageFiles,
    isPremiumSubscription,
    isMicSupported,
    isTemporaryChat,
  } = useContext(PentestGPTContext);

  const { isGenerating, selectedPlugin, isMobile } = useUIContext();

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput,
  } = useChatHandler();

  const { handleInputChange } = usePromptAndCommand();

  const { handleSelectDeviceFile } = useSelectFileHandler();

  const { sendMessage, stopMessage, canSend, isFileLoading } =
    useMessageHandler({
      isGenerating: isGenerating,
      userInput: userInput,
      chatMessages: chatMessages,
      handleSendMessage: handleSendMessage,
      handleStopMessage: handleStopMessage,
    });

  const { handleKeyDown, handlePaste } = useKeyboardHandler({
    isTyping: isTyping,
    isMobile: isMobile,
    sendMessage: sendMessage,
    handleSelectDeviceFile: handleSelectDeviceFile,
  });

  const handleTranscriptChange = (transcript: string) => {
    if (transcript !== userInput) {
      handleInputChange(transcript);
    }
  };

  const {
    isListening,
    setIsListening,
    hasMicAccess,
    startListening,
    cancelListening,
    isSpeechToTextLoading,
    hasSupportedMimeType,
    isRequestingMicAccess,
    requestMicAccess,
    micPermissionDenied,
  } = useVoiceRecording(handleTranscriptChange);

  // Effect for initial focus
  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput();
    }, 200); // FIX: hacky
  }, []);

  return (
    <div className="flex w-full justify-center">
      <div className="z-10 w-full max-w-[800px] items-end px-4 pb-3 sm:pb-5 md:px-8">
        {/* Unsupported files dialog */}
        {showConfirmationDialog && pendingFiles.length > 0 && (
          <UnsupportedFilesDialog
            isOpen={showConfirmationDialog}
            pendingFiles={pendingFiles}
            onCancel={() => {
              setPendingFiles([]);
              setShowConfirmationDialog(false);
            }}
            onConfirm={() => {
              pendingFiles.forEach(handleSelectDeviceFile);
              setShowConfirmationDialog(false);
              setPendingFiles([]);
            }}
          />
        )}

        {/* Files and Enhanced Menu Container */}
        <div
          className={cn('mb-2 flex flex-col flex-wrap justify-center gap-2')}
        >
          <ChatFilesDisplay />

          {chatMessages.length === 0 && temporaryChatMessages.length === 0 && (
            <ChatStarters
              selectedPlugin={selectedPlugin}
              chatMessages={chatMessages}
            />
          )}
        </div>

        {/* Chat Input Area */}
        <VoiceStatusBar
          isListening={isListening}
          isSpeechToTextLoading={isSpeechToTextLoading}
          onStop={() => setIsListening(false)}
          onCancel={() => {
            setIsListening(false);
            cancelListening();
          }}
        />
        {!isListening && !isSpeechToTextLoading && (
          <div className="relative flex flex-col">
            <div
              className={cn(
                'bg-secondary border-secondary relative w-full rounded-xl border-2',
                isTemporaryChat && 'bg-tertiary border-tertiary',
                selectedPlugin &&
                  selectedPlugin !== PluginID.NONE &&
                  'border-primary',
              )}
              ref={divRef}
            >
              {/* Upload files */}
              <Input
                ref={fileInputRef}
                className="hidden w-0"
                type="file"
                multiple
                onChange={(e) => {
                  if (!e.target.files) return;

                  const files = Array.from(e.target.files);

                  handleFileUpload(
                    files,
                    setShowConfirmationDialog,
                    setPendingFiles,
                    handleSelectDeviceFile,
                    newMessageImages,
                    newMessageFiles,
                  );
                }}
                accept="*"
              />

              <div className="w-full">
                <TextareaAutosize
                  textareaRef={chatInputRef as RefObject<HTMLTextAreaElement>}
                  className={cn(
                    'ring-offset-background placeholder:text-muted-foreground text-md',
                    'flex w-full resize-none rounded-t-xl bg-transparent',
                    'border-none focus-visible:outline-hidden',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'py-3',
                    'px-3',
                  )}
                  placeholder="Ask anything"
                  onValueChange={handleInputChange} // This function updates the userInput state
                  value={userInput} // This state should display the transcribed text
                  minRows={1}
                  maxRows={isMobile ? 6 : 12}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onCompositionStart={() => setIsTyping(true)}
                  onCompositionEnd={() => setIsTyping(false)}
                />
              </div>

              <div className="relative min-h-[44px] w-full px-2">
                <div className="absolute bottom-[10px] left-2 flex flex-row">
                  <ToolOptions
                    fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
                  />
                </div>

                <div className="absolute bottom-[10px] right-3 flex cursor-pointer items-center space-x-3">
                  {/* Mic button */}
                  <ChatMicButton
                    isPremiumSubscription={isPremiumSubscription}
                    isMicSupported={isMicSupported}
                    hasSupportedMimeType={hasSupportedMimeType}
                    userInput={userInput}
                    isGenerating={isGenerating}
                    micPermissionDenied={micPermissionDenied}
                    isRequestingMicAccess={isRequestingMicAccess}
                    hasMicAccess={hasMicAccess}
                    startListening={startListening}
                    requestMicAccess={requestMicAccess}
                  />
                  {/* Send button */}
                  <ChatSendButton
                    isGenerating={isGenerating}
                    canSend={canSend}
                    onSend={sendMessage}
                    onStop={stopMessage}
                    isFileLoading={isFileLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
