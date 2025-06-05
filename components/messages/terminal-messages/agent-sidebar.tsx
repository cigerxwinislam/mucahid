import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentSidebar } from '@/components/chat/chat-hooks/use-agent-sidebar';
import { useUIContext } from '@/context/ui-context';
import { AgentCodeBlock } from '@/components/ui/agent-codeblock';
import { bundledLanguages } from 'shiki/bundle/web';
import type { AgentCodeBlockLang } from '@/types';
import { CopyButton } from '@/components/messages/message-codeblock';
import stripAnsi from 'strip-ansi';
import type { InfoSearchWebBlock } from './types';
import { SearchResultsView } from './info-search-web-block';

export const AgentSidebar = () => {
  const { isMobile } = useUIContext();
  const { agentSidebar, resetAgentSidebar } = useAgentSidebar();

  if (!agentSidebar.isOpen || !agentSidebar.item) return null;

  // Fullscreen on mobile, normal on desktop
  const sidebarClass = isMobile
    ? 'fixed inset-0 z-50 w-full h-full bg-background flex flex-col overflow-hidden border-0'
    : 'flex h-full w-full flex-col overflow-hidden border-l border-border bg-background';

  // Get language from file extension if not provided
  const getLanguage = (filePath: string): AgentCodeBlockLang => {
    const extension = filePath.split('.').pop()?.toLowerCase() || 'text';
    return Object.keys(bundledLanguages).includes(extension)
      ? (extension as AgentCodeBlockLang)
      : 'text';
  };

  const filename =
    agentSidebar.item.lang === 'ansi'
      ? 'terminal'
      : agentSidebar.item.filePath.split('/').pop();

  return (
    <div className={sidebarClass}>
      {/* Top bar with icon, action and close button */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          {agentSidebar.item.icon}
          <span className="text-sm font-medium">
            {agentSidebar.item.action}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Close sidebar"
          tabIndex={0}
          onClick={resetAgentSidebar}
        >
          <X className="size-5" />
        </Button>
      </div>
      {/* File path */}
      <div className="flex items-center border-b border-border bg-muted px-4 py-2">
        <span className="text-xs font-mono text-muted-foreground truncate">
          {agentSidebar.item.filePath}
        </span>
      </div>
      {/* Content area */}
      {agentSidebar.item.action === 'Search Results' ? (
        <SearchResultsView
          block={agentSidebar.item.content as InfoSearchWebBlock}
        />
      ) : (
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full w-full flex flex-col rounded-md border border-border">
            <div className="flex items-center justify-between px-4 py-1 border-b bg-muted">
              <span className="text-xs text-muted-foreground font-mono">
                {filename}
              </span>
              <CopyButton
                value={
                  agentSidebar.item.lang === 'ansi'
                    ? stripAnsi(agentSidebar.item.content as string)
                    : (agentSidebar.item.content as string)
                }
              />
            </div>
            <div className="flex-1 overflow-auto">
              <AgentCodeBlock
                code={agentSidebar.item.content as string}
                lang={
                  agentSidebar.item.lang ||
                  getLanguage(agentSidebar.item.filePath)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
