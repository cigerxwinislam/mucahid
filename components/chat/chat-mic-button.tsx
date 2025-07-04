import { Mic, LoaderCircle } from 'lucide-react';
import { WithTooltip } from '../ui/with-tooltip';
import type { FC } from 'react';

interface ChatMicButtonProps {
  isPremiumSubscription: boolean;
  isMicSupported: boolean;
  hasSupportedMimeType: boolean;
  userInput: string;
  isGenerating: boolean;
  micPermissionDenied: boolean;
  isRequestingMicAccess: boolean;
  hasMicAccess: boolean;
  startListening: () => void;
  requestMicAccess: () => Promise<void>;
}

export const ChatMicButton: FC<ChatMicButtonProps> = ({
  isPremiumSubscription,
  isMicSupported,
  hasSupportedMimeType,
  userInput,
  isGenerating,
  micPermissionDenied,
  isRequestingMicAccess,
  hasMicAccess,
  startListening,
  requestMicAccess,
}) => {
  const shouldShowMicButton =
    isPremiumSubscription &&
    isMicSupported &&
    hasSupportedMimeType &&
    !userInput &&
    !isGenerating &&
    !micPermissionDenied;

  if (!shouldShowMicButton) return null;

  if (isRequestingMicAccess) {
    return (
      <LoaderCircle
        className="animate-spin cursor-pointer p-1 hover:opacity-50"
        size={30}
      />
    );
  }

  return (
    <WithTooltip
      side="top"
      display={
        <div className="flex flex-col">
          <p className="font-medium">Dictate</p>
        </div>
      }
      trigger={
        <Mic
          className="cursor-pointer rounded-lg rounded-bl-xl p-1 hover:bg-black/10 focus-visible:outline-black dark:hover:bg-white/10 dark:focus-visible:outline-white"
          onClick={async () => {
            if (hasMicAccess) {
              startListening();
            } else {
              await requestMicAccess();
            }
          }}
          size={30}
        />
      }
    />
  );
};
