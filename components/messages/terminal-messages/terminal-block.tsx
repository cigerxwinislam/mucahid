import React from 'react';
import { MessageMarkdown } from '../message-markdown';
import {
  SquareTerminal,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PluginID } from '@/types/plugins';
import { allTerminalPlugins } from '../message-type-solver';
import { useUIContext } from '@/context/ui-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CopyButton } from '../message-codeblock';
import {
  type TerminalBlock,
  MAX_VISIBLE_LINES,
  COMMAND_LENGTH_THRESHOLD,
} from './types';
import { ShowMoreButton } from './show-more-button';
import stripAnsi from 'strip-ansi';
import { useContext } from 'react';
import { PentestGPTContext } from '@/context/context';
import { AskTerminalCommandBlock } from './ask-terminal-command-block';
import { useAgentSidebar } from '@/components/chat/chat-hooks/use-agent-sidebar';

interface TerminalBlockProps {
  block: TerminalBlock;
  index: number;
  isClosed: boolean;
  isExpanded: boolean;
  onToggleBlock: (index: number) => void;
  onToggleExpanded: (index: number) => void;
  totalBlocks: number;
  isLastMessage: boolean;
}

const renderContent = (content: string) => (
  <MessageMarkdown content={content} isAssistant={true} />
);

export const TerminalBlockComponent: React.FC<TerminalBlockProps> = ({
  block,
  index,
  isClosed,
  isExpanded,
  onToggleBlock,
  onToggleExpanded,
  totalBlocks,
  isLastMessage,
}) => {
  const { toolInUse, isMobile, isGenerating } = useUIContext();
  const { selectedChat } = useContext(PentestGPTContext);
  const { setAgentSidebar } = useAgentSidebar();

  const isAskUser = selectedChat?.finish_reason === 'terminal_command_ask_user';
  const hasOutput = block.stdout || block.error;
  const commandPrompt = `\x1b[32mroot@debian:${block.exec_dir ? `~${block.exec_dir}` : '~'}$\x1b[0m ${block.command}`;
  const outputContent = [commandPrompt, block.stdout, block.error]
    .filter(Boolean)
    .join('\n\n');

  const lines = outputContent.split('\n');
  const shouldShowMore = lines.length > MAX_VISIBLE_LINES;
  const isLastBlock = index === totalBlocks - 1;

  const handleShowInSidebar = () => {
    setAgentSidebar({
      isOpen: true,
      item: {
        action: 'Executing command',
        filePath: block.exec_dir || '/',
        content: outputContent,
        icon: <SquareTerminal size={16} />,
        lang: 'ansi',
      },
    });
  };

  // Show last lines during generation, first lines after generation stops
  const displayedContent = isExpanded
    ? outputContent
    : isGenerating && isLastBlock
      ? lines.slice(-MAX_VISIBLE_LINES).join('\n')
      : lines.slice(0, MAX_VISIBLE_LINES).join('\n');

  const isLongCommand =
    block.command.length > COMMAND_LENGTH_THRESHOLD || isMobile;
  const showFullTerminalView = isLongCommand;

  if (isLastMessage && !isGenerating && isAskUser && isLastBlock) {
    return (
      <AskTerminalCommandBlock
        command={block.command}
        execDir={block.exec_dir || '/'}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${index === 1 ? 'mb-3' : 'my-3'}`}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b border-border bg-muted px-4 py-2 hover:bg-muted/80 transition-colors cursor-pointer',
        )}
        onClick={handleShowInSidebar}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={cn('flex items-center shrink-0 mr-2', {
              'animate-pulse':
                isLastBlock &&
                allTerminalPlugins.includes(toolInUse as PluginID),
            })}
          >
            <SquareTerminal size={16} className="mr-2" />
            <span>Executing command</span>
          </div>
          <div className="min-w-0 flex-1">
            <code className="truncate block font-mono text-muted-foreground text-sm">
              {block.command}
            </code>
          </div>
        </div>
        {isLastBlock && isGenerating && hasOutput && (
          <div className="flex items-center ml-4">
            <CopyButton value={stripAnsi(outputContent)} />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBlock(index);
              }}
              aria-expanded={!isClosed}
              aria-controls={`terminal-content-${index}`}
            >
              {isClosed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </Button>
          </div>
        )}
      </div>
      {isLastBlock && isGenerating && !isClosed && (
        <div
          id={`terminal-content-${index}`}
          className="bg-foreground dark:bg-background"
        >
          {showFullTerminalView && (
            <div className="font-mono text-foreground/80">
              {renderContent(
                `\`\`\`stdout\nroot@debian:${block.exec_dir ? `~${block.exec_dir}` : '~'}$ ${block.command}\n\`\`\``,
              )}
            </div>
          )}
          {block.stdout && (
            <div className="font-mono text-foreground/80">
              {shouldShowMore && isGenerating && isLastBlock && (
                <ShowMoreButton
                  isExpanded={isExpanded}
                  onClick={() => onToggleExpanded(index)}
                  remainingCount={lines.length - MAX_VISIBLE_LINES}
                  icon={
                    isExpanded ? <ArrowDown size={16} /> : <ArrowUp size={16} />
                  }
                />
              )}
              {renderContent(
                `\`\`\`stdout\n${shouldShowMore ? displayedContent : block.stdout}\n\`\`\``,
              )}
              {shouldShowMore &&
                block.stdout.split('\n').length > MAX_VISIBLE_LINES &&
                !(isGenerating && isLastBlock) && (
                  <ShowMoreButton
                    isExpanded={isExpanded}
                    onClick={() => onToggleExpanded(index)}
                    remainingCount={lines.length - MAX_VISIBLE_LINES}
                    icon={
                      isExpanded ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )
                    }
                  />
                )}
            </div>
          )}
          {block.error && (
            <div className="font-mono text-destructive/90">
              {renderContent(`\`\`\`stdout\n${block.error}\n\`\`\``)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
