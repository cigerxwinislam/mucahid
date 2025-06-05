import React from 'react';
import type { InfoSearchWebBlock } from './types';
import { Search } from 'lucide-react';
import { parse } from 'tldts';
import { useAgentSidebar } from '@/components/chat/chat-hooks/use-agent-sidebar';

export const SearchResultsView = ({ block }: { block: InfoSearchWebBlock }) => {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="divide-y divide-border">
        {block.results.map((result, index) => (
          <div
            key={`${result.url}-${index}`}
            className="flex flex-col p-2 bg-background hover:bg-accent transition-colors"
          >
            <div className="flex flex-row items-start gap-3">
              <img
                src={`https://www.google.com/s2/favicons?domain=${getDomain(result.url)}`}
                alt="Website icon"
                className="w-6 h-6 rounded-full border border-border bg-white mt-1 flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-xs leading-tight mb-0.5">
                  {getMainDomain(result.url)}
                </div>
                <div className="text-xs text-muted-foreground mb-1 truncate">
                  {result.url}
                </div>
              </div>
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block focus:outline-none focus:ring-2 focus:ring-accent"
              tabIndex={0}
              aria-label={`Open ${result.title}`}
            >
              <h3 className="text-base font-semibold text-blue-400 hover:text-blue-300 truncate">
                {result.title}
              </h3>
            </a>
            <p className="text-sm text-foreground/90 leading-normal">
              {result.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface InfoSearchWebBlockProps {
  block: InfoSearchWebBlock;
}

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// Returns the main domain (no TLD), capitalized
const getMainDomain = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const parsed = parse(hostname);
    if (parsed.domainWithoutSuffix) {
      return (
        parsed.domainWithoutSuffix.charAt(0).toUpperCase() +
        parsed.domainWithoutSuffix.slice(1).toLowerCase()
      );
    }
    return hostname;
  } catch {
    return '';
  }
};

export const InfoSearchWebBlockComponent: React.FC<InfoSearchWebBlockProps> = ({
  block,
}) => {
  const { setAgentSidebar } = useAgentSidebar();

  const handleActionClick = () => {
    setAgentSidebar({
      isOpen: true,
      item: {
        action: 'Search Results',
        filePath: block.query || '',
        content: block,
        icon: <Search size={16} />,
      },
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border my-3 bg-muted">
      <div
        className="flex items-center border-b border-border bg-muted px-4 py-2 hover:opacity-50 cursor-pointer"
        onClick={handleActionClick}
      >
        <div className="flex items-center shrink-0 mr-2">
          <Search size={16} className="text-muted-foreground mr-2" />
          <span className="text-sm font-medium text-foreground/80">
            Searching
          </span>
        </div>
        <span className="flex-1 min-w-0 font-mono text-xs text-foreground">
          {block.query || ''}
        </span>
      </div>
    </div>
  );
};
