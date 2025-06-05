'use client';

import { File, X, Download, Eye, Ellipsis } from 'lucide-react';
import type { FileAttachment } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { downloadFile, downloadFilesAsZip } from '@/db/storage/files';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface FilesModalProps {
  files: FileAttachment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileClick: (file: FileAttachment) => void;
}

export const FilesModal: React.FC<FilesModalProps> = ({
  files,
  open,
  onOpenChange,
  onFileClick,
}) => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Reset selections when modal is closed
  useEffect(() => {
    if (!open) {
      setIsBatchMode(false);
      setSelectedFiles([]);
      setDownloadProgress({ current: 0, total: 0 });
    }
  }, [open]);

  const toggleFileSelection = (fileUrl: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileUrl)
        ? prev.filter((url) => url !== fileUrl)
        : [...prev, fileUrl],
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.url));
    }
  };

  const handleView = (file: FileAttachment) => {
    if (isBatchMode) {
      toggleFileSelection(file.url);
    } else {
      onFileClick(file);
    }
  };

  const handleDownload = async (file: FileAttachment) => {
    try {
      setIsDownloading(file.url);
      await downloadFile(file.url, file.fileName);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected for download');
      return;
    }

    setIsBatchDownloading(true);
    setDownloadProgress({ current: 0, total: 1 });

    try {
      // Create a timestamp-based filename for the ZIP
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `PentestGPT-Files-${timestamp}.zip`;

      // Prepare the files array for batch download
      const filesToDownload = selectedFiles.map((fileUrl) => {
        const file = files.find((f) => f.url === fileUrl);
        return {
          url: fileUrl,
          fileName: file?.fileName || 'unknown',
        };
      });

      // Use the ZIP download function
      const result = await downloadFilesAsZip(
        filesToDownload,
        zipFileName,
        (current, total) => setDownloadProgress({ current, total }),
      );

      if (result.failed > 0) {
        if (result.success > 0) {
          toast.success(
            `Created ZIP with ${result.success} files (${result.failed} failed)`,
          );
        } else {
          toast.error('Failed to add any files to the ZIP');
        }
      } else {
        toast.success(`Successfully created ZIP with ${result.success} files`);
      }
    } catch (error) {
      console.error('ZIP creation error:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      setIsBatchDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    downloadProgress.total > 0
      ? Math.min(
          Math.round((downloadProgress.current / downloadProgress.total) * 100),
          100,
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-full w-full">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {!isBatchMode && <DialogTitle>All files in this task</DialogTitle>}
            {isBatchMode && (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={toggleSelectAll}
              >
                {selectedFiles.length === files.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsBatchMode(!isBatchMode)}
            >
              {isBatchMode ? 'Cancel' : <Download className="size-5" />}
            </Button>
            {!isBatchMode && (
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </Button>
              </DialogClose>
            )}
          </div>
        </DialogHeader>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.url}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 group',
                isBatchMode
                  ? 'cursor-pointer hover:bg-primary/5'
                  : 'hover:bg-primary/10',
                isBatchMode &&
                  selectedFiles.includes(file.url) &&
                  'bg-primary/5',
              )}
              onClick={
                isBatchMode
                  ? () => toggleFileSelection(file.url)
                  : () => handleView(file)
              }
              tabIndex={0}
              role="button"
              aria-label={
                isBatchMode
                  ? selectedFiles.includes(file.url)
                    ? 'Deselect file'
                    : 'Select file'
                  : 'View file'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (isBatchMode) {
                    toggleFileSelection(file.url);
                  } else {
                    handleView(file);
                  }
                }
              }}
            >
              {isBatchMode && (
                <div className="pr-1">
                  <Checkbox
                    checked={selectedFiles.includes(file.url)}
                    onCheckedChange={() => toggleFileSelection(file.url)}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  />
                </div>
              )}
              <File className="text-primary flex-shrink-0" />
              <div className="flex-1 truncate">
                <div className="truncate font-medium">{file.fileName}</div>
                <div className="truncate text-xs opacity-60">
                  {file.mimeType
                    ? file.mimeType.split('/')[1]?.toUpperCase()
                    : 'File'}
                </div>
              </div>
              {!isBatchMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="File actions"
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Ellipsis size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => handleView(file)}
                    >
                      <Eye className="mr-2 size-5" />
                      <span>View</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(
                        'cursor-pointer',
                        isDownloading === file.url &&
                          'pointer-events-none opacity-50',
                      )}
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="mr-2 size-5" />
                      <span>
                        {isDownloading === file.url
                          ? 'Downloading...'
                          : 'Download'}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
        {isBatchMode && (
          <DialogFooter className="border-t pt-4 flex-col gap-4">
            {isBatchDownloading && (
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>Creating ZIP file...</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            <div className="flex w-full items-center justify-end">
              <Button
                onClick={handleBatchDownload}
                disabled={selectedFiles.length === 0 || isBatchDownloading}
                className="ml-auto"
              >
                {isBatchDownloading ? (
                  <>Creating ZIP...</>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Batch download
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
