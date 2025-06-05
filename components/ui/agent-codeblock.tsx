'use client';

import { type JSX, useLayoutEffect, useState } from 'react';
import { highlight, CODE_THEMES } from '@/lib/shiki/shared';
import { cn } from '@/lib/utils';
import type { AgentCodeBlockLang } from '@/types';
import { useTheme } from 'next-themes';

interface AgentCodeBlockProps {
  code: string;
  lang: AgentCodeBlockLang;
}

export function AgentCodeBlock({ code, lang }: AgentCodeBlockProps) {
  const [nodes, setNodes] = useState<JSX.Element | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    setIsLoading(true);

    const theme =
      resolvedTheme === 'dark' ? CODE_THEMES.dark : CODE_THEMES.light;

    void highlight(code, {
      lang,
      theme,
      customComponents: {
        pre: (props) => (
          <pre
            {...props}
            className={cn(
              'relative rounded-b-md overflow-hidden text-sm break-words whitespace-pre-wrap h-full',
            )}
          />
        ),
        code: (props) => (
          <code
            {...props}
            className="block p-2 overflow-x-auto break-all whitespace-pre-wrap text-sm h-full"
          />
        ),
      },
    })
      .then(setNodes)
      .finally(() => setIsLoading(false));
  }, [code, lang, resolvedTheme]);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-muted/50 rounded-md p-4')}>
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded mt-2" />
      </div>
    );
  }

  return <div className="relative overflow-hidden h-full">{nodes}</div>;
}
