import { dragHelper } from '@/components/chat/chat-helpers/drag';
import { PentestGPTContext } from '@/context/context';
import { useUIContext } from '@/context/ui-context';
import type { MessageImage } from '@/types';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { type FC, useContext, useState } from 'react';
import { WithTooltip } from '../ui/with-tooltip';
import { ChatFileItem } from './chat-file-item';
import { deleteFile } from '@/db/files';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const DynamicFilePreview = dynamic(() => import('../ui/file-preview'), {
  ssr: false,
});

export const ChatFilesDisplay: FC = () => {
  const {
    newMessageImages,
    setNewMessageImages,
    newMessageFiles,
    setNewMessageFiles,
    chatImages,
    setChatImages,
  } = useContext(PentestGPTContext);

  const { isMobile } = useUIContext();

  const [selectedFile, setSelectedFile] = useState<Doc<'files'> | null>(null);
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [isHovering, setIsHovering] = useState(false);

  const messageImages = [
    ...newMessageImages.filter(
      (image) =>
        !chatImages.some(
          (chatImage) => chatImage.messageId === image.messageId,
        ),
    ),
  ];

  const handleRemoveFile = (fileId: Id<'files'>) => {
    const fileToRemove = newMessageFiles.find((f) => f._id === fileId);
    if (fileToRemove) {
      deleteFile(fileToRemove._id);
      setNewMessageFiles(newMessageFiles.filter((f) => f._id !== fileId));
    }
  };

  return (
    <div className="w-full">
      {showPreview && selectedImage && (
        <DynamicFilePreview
          type="image"
          item={selectedImage}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen);
            setSelectedImage(null);
          }}
        />
      )}

      {showPreview && selectedFile && (
        <DynamicFilePreview
          type="file"
          item={selectedFile}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen);
            setSelectedFile(null);
          }}
        />
      )}

      <div className="flex w-full justify-center">
        <div className="w-full max-w-[800px]">
          <div className="overflow-auto">
            <div
              className="scrollbar-hide sm:scrollbar-show flex w-[calc(100vw-2rem)] gap-2 overflow-x-auto pt-2 sm:w-full sm:max-w-[800px]"
              onMouseDown={dragHelper}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {messageImages.map((image) => (
                <div
                  key={`${image.messageId}-${image.path}`}
                  className="relative flex h-[64px] cursor-pointer items-center space-x-4 rounded-xl hover:opacity-50"
                >
                  <div className="relative">
                    <Image
                      className={`rounded ${image.isLoading ? 'opacity-60' : ''}`}
                      // Force the image to be 56px by 56px
                      style={{
                        minWidth: '56px',
                        minHeight: '56px',
                        maxHeight: '56px',
                        maxWidth: '56px',
                      }}
                      src={image.base64} // Preview images will always be base64
                      alt="File image"
                      width={56}
                      height={56}
                      onClick={() => {
                        if (!image.isLoading) {
                          setSelectedImage(image);
                          setShowPreview(true);
                        }
                      }}
                    />

                    {/* Loading overlay */}
                    {image.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="size-6 animate-spin text-primary" />
                      </div>
                    )}

                    {/* Error indicator */}
                    {image.hasError && (
                      <div className="absolute bottom-0 right-0">
                        <WithTooltip
                          delayDuration={0}
                          side="top"
                          display={<div>Upload failed</div>}
                          trigger={
                            <AlertCircle className="size-5 rounded-full bg-white text-red-500" />
                          }
                        />
                      </div>
                    )}
                  </div>

                  {(isMobile || isHovering) && (
                    <WithTooltip
                      delayDuration={0}
                      side="top"
                      display={<div>Remove image</div>}
                      trigger={
                        <X
                          className="bg-secondary border-primary absolute right-[-6px] top-[-2px] flex size-5 cursor-pointer items-center justify-center rounded-full border text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewMessageImages(
                              newMessageImages.filter(
                                (f) => f.messageId !== image.messageId,
                              ),
                            );
                            setChatImages(
                              chatImages.filter(
                                (f) => f.messageId !== image.messageId,
                              ),
                            );
                          }}
                        />
                      }
                    />
                  )}
                </div>
              ))}

              {newMessageFiles.map((file) => (
                <ChatFileItem
                  key={file._id}
                  file={file}
                  isLoading={file._id.startsWith('loading')}
                  showRemoveButton={isMobile || isHovering}
                  onRemove={handleRemoveFile}
                  onClick={() => {
                    setSelectedFile(file);
                    setShowPreview(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
