import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { CircleDashed, CircleCheck, Pause, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIContext } from '@/context/ui-context';

type MessageStatusProps = {
  isLastMessage: boolean;
  isAssistant: boolean;
  finish_reason?: string | null;
};

const isValidFinishReason = (
  reason: string | null | undefined,
): reason is 'message_ask_user' | 'idle' | 'aborted' | 'refusal' => {
  return (
    reason === 'message_ask_user' ||
    reason === 'idle' ||
    reason === 'aborted' ||
    reason === 'refusal'
  );
};

export const MessageStatus: FC<MessageStatusProps> = ({
  isLastMessage,
  isAssistant,
  finish_reason,
}) => {
  const { isGenerating } = useUIContext();

  if (
    !isLastMessage ||
    !isAssistant ||
    isGenerating ||
    !finish_reason ||
    !isValidFinishReason(finish_reason)
  )
    return null;

  const statusConfig = {
    message_ask_user: {
      icon: CircleDashed,
      text: 'PentestGPT will continue working after your reply',
      color: 'var(--function-warning)',
      bgClass: 'bg-[var(--function-warning)]/10',
    },
    idle: {
      icon: CircleCheck,
      text: 'PentestGPT has completed the current task',
      color: 'var(--function-success)',
      bgClass: 'bg-[var(--function-success)]/10',
    },
    aborted: {
      icon: Pause,
      text: 'PentestGPT has stopped, send a new message to continue',
      color: 'var(--function-warning)',
      bgClass: 'bg-[var(--function-warning)]/10',
    },
    refusal: {
      icon: AlertCircle,
      text: 'PentestGPT refused for safety reasons',
      color: 'var(--function-error)',
      bgClass: 'bg-[var(--function-error)]/10',
    },
  };

  const { icon: Icon, text, color, bgClass } = statusConfig[finish_reason];

  return (
    <div className="relative mb-4 flex justify-start">
      <Badge
        variant="outline"
        className={cn(
          'rounded-full border-0 px-3 py-1.5 text-sm max-w-full',
          'whitespace-normal break-words',
          bgClass,
        )}
        style={{ color }}
      >
        <Icon className="mr-1 shrink-0" style={{ color }} />
        <span className="break-words">{text}</span>
      </Badge>
    </div>
  );
};
