import { File, Eye, FileSearch } from 'lucide-react';
import type { FileAttachment } from '@/types';
import type { Json } from '@/supabase/types';
import { getFileFromStorage } from '@/db/storage/files';
import { useState } from 'react';
import { FilesModal } from './files-modal';
import { Button } from '@/components/ui/button';

interface MessageAttachmentsProps {
  attachments: Json[];
  isAssistant: boolean;
}

const FileAttachmentCard: React.FC<{
  file: FileAttachment;
  onClick?: () => void;
}> = ({ file, onClick }) => (
  <Button
    variant="secondary"
    className="relative h-auto w-[280px] justify-start px-4 py-2 text-left group"
    onClick={onClick}
  >
    <div className="flex items-center space-x-4 w-full">
      <div className="rounded shrink-0">
        <File className="text-primary" />
      </div>
      <div className="truncate text-sm">
        <div className="truncate font-medium">{file.fileName}</div>
        <div className="truncate text-muted-foreground">
          {file.mimeType ? file.mimeType.split('/')[1]?.toUpperCase() : 'File'}
        </div>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="w-5 h-5" />
      </div>
    </div>
  </Button>
);

const ViewAllFilesCard: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <Button
    variant="secondary"
    className="relative h-auto w-[280px] justify-start px-4 py-2 text-left"
    onClick={onClick}
  >
    <div className="flex items-center space-x-4 w-full">
      <div className="rounded shrink-0">
        <FileSearch className="text-primary" />
      </div>
      <div className="flex-1 truncate text-sm">
        <div className="truncate font-medium">View all files in this task</div>
      </div>
    </div>
  </Button>
);

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  isAssistant,
}) => {
  const [open, setOpen] = useState(false);

  if (!isAssistant || !attachments || attachments.length === 0) return null;

  const files = attachments.map((a) => a as unknown as FileAttachment);

  const handleFileClick = async (fileAttachment: FileAttachment) => {
    try {
      const link = await getFileFromStorage(fileAttachment.url);
      window.open(link, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.length === 1 ? (
        <FileAttachmentCard
          file={files[0]}
          onClick={() => handleFileClick(files[0])}
        />
      ) : (
        <>
          <FileAttachmentCard
            file={files[0]}
            onClick={() => handleFileClick(files[0])}
          />
          <ViewAllFilesCard onClick={() => setOpen(true)} />
          <FilesModal
            files={files}
            open={open}
            onOpenChange={setOpen}
            onFileClick={handleFileClick}
          />
        </>
      )}
    </div>
  );
};
