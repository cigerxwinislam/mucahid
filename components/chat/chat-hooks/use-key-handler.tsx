import { useUIContext } from '@/context/ui-context';
import { PentestGPTContext } from '@/context/context';
import { useContext } from 'react';
import { toast } from 'sonner';
import { PLUGINS_WITHOUT_IMAGE_SUPPORT } from '@/types/plugins';

interface UseKeyboardHandlerProps {
  isTyping: boolean;
  isMobile: boolean;
  sendMessage: () => void;
  handleSelectDeviceFile: (file: File) => void;
  chatSettings?: { model: string };
}

export const useKeyboardHandler = ({
  isTyping,
  isMobile,
  sendMessage,
  handleSelectDeviceFile,
  chatSettings,
}: UseKeyboardHandlerProps) => {
  const { selectedPlugin } = useUIContext();
  const { isPremiumSubscription } = useContext(PentestGPTContext);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle send message on Enter
    if (!isTyping && event.key === 'Enter' && !event.shiftKey && !isMobile) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        // Check if the active plugin doesn't support images
        if (
          selectedPlugin &&
          PLUGINS_WITHOUT_IMAGE_SUPPORT.includes(selectedPlugin)
        ) {
          toast.error('Images are not allowed when using this feature');
          return;
        }

        // Check if using reasoning model
        if (chatSettings?.model === 'reasoning-model') {
          toast.error(
            'Image uploads are not supported with the Reasoning Model',
          );
          return;
        }

        if (!isPremiumSubscription) {
          toast.error(
            'Image uploads are only available for pro and team users. Please upgrade to upload images.',
          );
          return;
        }
        const file = item.getAsFile();
        if (!file) return;
        handleSelectDeviceFile(file);
      }
    }
  };

  return { handleKeyDown, handlePaste };
};
