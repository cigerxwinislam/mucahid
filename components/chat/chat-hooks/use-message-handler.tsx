import type { ChatMessage } from '@/types';
import { useContext } from 'react';
import { PentestGPTContext } from '@/context/context';

interface UseMessageHandlerProps {
  isGenerating: boolean;
  userInput: string;
  chatMessages: ChatMessage[];
  handleSendMessage: (
    message: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean,
    shouldAddMessage?: boolean,
  ) => void;
  handleStopMessage: () => void;
}

export const useMessageHandler = ({
  isGenerating,
  userInput,
  chatMessages,
  handleSendMessage,
  handleStopMessage,
}: UseMessageHandlerProps) => {
  const { newMessageFiles, newMessageImages } = useContext(PentestGPTContext);

  const sendMessage = () => {
    if (!userInput || isGenerating) return;
    handleSendMessage(userInput, chatMessages, false, false);
  };

  const stopMessage = () => {
    if (!isGenerating) return;
    handleStopMessage();
  };

  const fileLoading = newMessageFiles.some((file) =>
    file._id.startsWith('loading'),
  );

  const imageLoading = newMessageImages.some((image) => image.isLoading);

  return {
    sendMessage,
    stopMessage,
    canSend: !!userInput && !isGenerating && !fileLoading && !imageLoading,
    isFileLoading: fileLoading || imageLoading,
  };
};
