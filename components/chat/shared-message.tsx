'use client';

import React from 'react';
import { MessageTypeResolver } from '@/components/messages/message-type-solver';
import { ImageIcon } from 'lucide-react';
import type { Doc } from '@/convex/_generated/dataModel';

interface SharedMessageProps {
  message: Doc<'messages'>;
  isLastMessage: boolean;
}

export const SharedMessage: React.FC<SharedMessageProps> = ({
  message,
  isLastMessage,
}) => {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex w-full flex-col px-0 py-6 sm:w-[550px] sm:px-4 md:w-[650px] xl:w-[800px]">
        <div className="flex space-x-3">
          <div
            className={`min-w-0 grow ${message.role === 'user' ? 'flex justify-end' : ''}`}
          >
            <div>
              {message.image_paths.length > 0 && (
                <div
                  className={`flex items-center gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Uploaded an image</span>
                </div>
              )}
              <MessageTypeResolver
                message={message}
                isLastMessage={isLastMessage}
                toolInUse="none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
