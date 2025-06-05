import { cn } from '@/lib/utils';
import type { FC } from 'react';
import { WithTooltip } from '../ui/with-tooltip';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatSendButtonProps {
  isGenerating: boolean;
  canSend: boolean;
  onSend: () => void;
  onStop: () => void;
  isFileLoading?: boolean;
}

export const ChatSendButton: FC<ChatSendButtonProps> = ({
  isGenerating,
  canSend,
  onSend,
  onStop,
  isFileLoading,
}) => {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center">
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8"
          onClick={onStop}
        >
          <Square className="animate-pulse" size={14} fill="currentColor" />
        </Button>
      </div>
    );
  }

  return (
    <WithTooltip
      display={!canSend && isFileLoading ? 'File upload pending' : undefined}
      trigger={
        <div className="flex items-center justify-center">
          <Button
            variant="default"
            size="icon"
            className={cn(
              'h-8 w-8',
              !canSend && 'cursor-not-allowed opacity-50',
            )}
            onClick={onSend}
            disabled={!canSend}
          >
            <ArrowUp strokeWidth={2} size={20} />
          </Button>
        </div>
      }
    />
  );
};
