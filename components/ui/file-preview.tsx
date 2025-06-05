import { cn } from '@/lib/utils';
import type { MessageImage } from '@/types';
import { File } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent } from './dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import type { Doc } from '@/convex/_generated/dataModel';

interface FilePreviewProps {
  type: 'image' | 'file' | 'file_item';
  item: Doc<'files'> | MessageImage | Doc<'file_items'>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function FilePreview({
  type,
  item,
  isOpen,
  onOpenChange,
}: FilePreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">File Preview</DialogTitle>

      <DialogContent
        className={cn(
          'flex items-center justify-center outline-hidden',
          'border-transparent bg-transparent',
        )}
      >
        {(() => {
          if (type === 'image') {
            const imageItem = item as MessageImage;

            return (
              <Image
                className="rounded"
                src={imageItem.base64 || imageItem.url}
                alt="File image"
                width={2000}
                height={2000}
                style={{
                  maxHeight: '67vh',
                  maxWidth: '67vw',
                }}
              />
            );
          } else if (type === 'file_item') {
            const fileItem = item as Doc<'file_items'>;
            return (
              <div className="bg-background text-primary max-h-[75vh] max-w-[95vw] overflow-auto whitespace-pre-wrap rounded-xl p-4 shadow-lg md:min-w-[50vw] lg:min-w-[700px]">
                <div className="text-lg leading-relaxed">
                  {fileItem.content}
                </div>
              </div>
            );
          } else if (type === 'file') {
            return (
              <div className="rounded bg-blue-500 p-2">
                <File />
              </div>
            );
          }
        })()}
      </DialogContent>
    </Dialog>
  );
}
