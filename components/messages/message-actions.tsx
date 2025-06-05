import { PentestGPTContext } from '@/context/context';
import {
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from '@tabler/icons-react';
import { Check, Copy, Edit, Repeat } from 'lucide-react';
import { type FC, useContext, useEffect, useState } from 'react';
import { WithTooltip } from '../ui/with-tooltip';
import { SwitchModel } from '../ui/switch-model';
import { useUIContext } from '@/context/ui-context';

export const MESSAGE_ICON_SIZE = 20;

interface MessageActionsProps {
  isAssistant: boolean;
  isLastMessage: boolean;
  isEditing: boolean;
  isHovering: boolean;
  isGoodResponse: boolean;
  isBadResponse: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onRegenerateSpecificModel: (model: string) => void;
  onGoodResponse: () => void;
  onBadResponse: () => void;
  messageHasImage: boolean;
  messageContent: string;
  messageModel: string;
}

export const MessageActions: FC<MessageActionsProps> = ({
  isAssistant,
  isLastMessage,
  isEditing,
  isHovering,
  isGoodResponse,
  isBadResponse,
  onCopy,
  onEdit,
  onRegenerate,
  onRegenerateSpecificModel,
  onGoodResponse,
  onBadResponse,
  messageHasImage,
  messageContent,
  messageModel,
}) => {
  const { isPremiumSubscription, isTemporaryChat } =
    useContext(PentestGPTContext);

  const { isMobile, isGenerating } = useUIContext();

  const [showCheckmark, setShowCheckmark] = useState(false);

  const MESSAGE_ICON_SIZE = isMobile ? 22 : 20;
  const isMessageLengthTooShort = messageContent.length === 0;

  useEffect(() => {
    if (showCheckmark) {
      const timer = setTimeout(() => {
        setShowCheckmark(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showCheckmark]);

  const handleCopy = () => {
    onCopy();
    setShowCheckmark(true);
  };

  return (isLastMessage && isGenerating) || isEditing ? null : (
    <div className={`text-muted-foreground flex items-center space-x-4`}>
      {/* Temporary chat doesn't have edit functionality */}
      {(isHovering || isLastMessage) &&
        !isAssistant &&
        !messageHasImage &&
        !isTemporaryChat && (
          <WithTooltip
            delayDuration={0}
            side="bottom"
            display={<div>Edit</div>}
            trigger={
              <Edit
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onEdit}
              />
            }
          />
        )}

      {(isHovering || isLastMessage) && !isMessageLengthTooShort && (
        <WithTooltip
          delayDuration={0}
          side="bottom"
          display={<div>Copy</div>}
          trigger={
            showCheckmark ? (
              <Check size={MESSAGE_ICON_SIZE} />
            ) : (
              <Copy
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={handleCopy}
              />
            )
          }
        />
      )}

      {(isHovering || isLastMessage) && isAssistant && !isTemporaryChat && (
        <WithTooltip
          delayDuration={0}
          side="bottom"
          display={<div>Good Response</div>}
          trigger={
            isGoodResponse ? (
              <IconThumbUpFilled
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onGoodResponse}
              />
            ) : (
              <IconThumbUp
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onGoodResponse}
              />
            )
          }
        />
      )}

      {(isHovering || isLastMessage) && isAssistant && !isTemporaryChat && (
        <WithTooltip
          delayDuration={0}
          side="bottom"
          display={<div>Bad Response</div>}
          trigger={
            isBadResponse ? (
              <IconThumbDownFilled
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onBadResponse}
              />
            ) : (
              <IconThumbDown
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onBadResponse}
              />
            )
          }
        />
      )}

      {isLastMessage &&
        isAssistant &&
        !messageHasImage &&
        !isPremiumSubscription && (
          <WithTooltip
            delayDuration={0}
            side="bottom"
            display={<div>Regenerate</div>}
            trigger={
              <Repeat
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={onRegenerate}
              />
            }
          />
        )}

      {isLastMessage &&
        isAssistant &&
        !messageHasImage &&
        isPremiumSubscription && (
          <SwitchModel
            currentModel={messageModel}
            onChangeModel={onRegenerateSpecificModel}
            isMobile={isMobile}
          />
        )}
    </div>
  );
};
