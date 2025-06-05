import React from 'react';
import type { FileContentBlock } from './types';
import { FilePen } from 'lucide-react';
import { useAgentSidebar } from '@/components/chat/chat-hooks/use-agent-sidebar';

interface FileContentBlockComponentProps {
  block: FileContentBlock;
  index: number;
}

export const FileContentBlockComponent: React.FC<
  FileContentBlockComponentProps
> = ({ block, index }) => {
  const { setAgentSidebar } = useAgentSidebar();

  const handleActionClick = () => {
    setAgentSidebar({
      isOpen: true,
      item: {
        action: getActionText(),
        filePath: block.path,
        content: block.content,
        icon: <FilePen size={16} />,
      },
    });
  };

  const getActionText = () => {
    switch (block.mode) {
      case 'overwrite':
        return 'Editing file';
      case 'append':
        return 'Appending to file';
      case 'create':
        return 'Creating file';
      case 'read':
      default:
        return 'Reading file';
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${index === 1 ? 'mb-3' : 'my-3'}`}
    >
      <div
        className="flex items-center justify-between border-b border-border bg-muted px-4 py-2 hover:opacity-50 cursor-pointer"
        onClick={handleActionClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex items-center shrink-0 mr-2">
            <FilePen size={16} className="mr-2" />
            <span>{getActionText()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <code className="truncate block font-mono text-muted-foreground text-sm">
              {block.path}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
