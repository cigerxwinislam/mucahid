import React, { useState, useMemo, useCallback } from 'react';
import { MessageMarkdown } from '../message-markdown';
import type { MessageTerminalProps } from './types';
import { parseContent } from './content-parser';
import { TerminalBlockComponent } from './terminal-block';
import { FileContentBlockComponent } from './file-content-block';
import { ShellWaitBlockComponent } from './shell-wait-block';
import { InfoSearchWebBlockComponent } from './info-search-web-block';

export const MessageTerminal: React.FC<MessageTerminalProps> = ({
  content,
  isAssistant,
  isLastMessage,
}) => {
  const contentBlocks = useMemo(() => parseContent(content), [content]);

  const [closedBlocks, setClosedBlocks] = useState(() => new Set<number>());
  const [expandedOutputs, setExpandedOutputs] = useState(
    () => new Set<number>(),
  );

  const toggleBlock = useCallback((index: number) => {
    setClosedBlocks((prev) => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedOutputs((prev) => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  }, []);

  return (
    <div>
      {contentBlocks.map((block, index) => (
        <React.Fragment key={index}>
          {block.type === 'text' ? (
            <MessageMarkdown
              content={block.content as string}
              isAssistant={isAssistant}
            />
          ) : block.type === 'terminal' ? (
            <TerminalBlockComponent
              block={block.content}
              index={index}
              isClosed={closedBlocks.has(index)}
              isExpanded={expandedOutputs.has(index)}
              onToggleBlock={toggleBlock}
              onToggleExpanded={toggleExpanded}
              totalBlocks={contentBlocks.length}
              isLastMessage={isLastMessage}
            />
          ) : block.type === 'shell-wait' ? (
            <ShellWaitBlockComponent block={block.content} />
          ) : block.type === 'info-search-web' ? (
            <InfoSearchWebBlockComponent block={block.content} />
          ) : (
            <FileContentBlockComponent block={block.content} index={index} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
