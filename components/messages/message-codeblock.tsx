import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Check, Copy } from 'lucide-react';
import { type FC, memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface MessageCodeBlockProps {
  language: string;
  value: string;
}

export const CopyButton: FC<{
  value: string;
  title?: string;
  className?: string;
}> = memo(({ value, title = 'Copy to clipboard', className }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  return (
    <Button
      title={title}
      variant="ghost"
      size="sm"
      className={cn(
        'text-xs focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0',
        className,
      )}
      onClick={() => !isCopied && copyToClipboard(value)}
      aria-label={isCopied ? 'Copied' : 'Copy to clipboard'}
    >
      <span className="flex items-center space-x-1">
        {isCopied ? <Check size={16} /> : <Copy size={16} />}
        <span className="hidden sm:inline">
          {isCopied ? 'Copied!' : 'Copy'}
        </span>
      </span>
    </Button>
  );
});

CopyButton.displayName = 'CopyButton';

export const MessageCodeBlock: FC<MessageCodeBlockProps> = memo(
  ({ language, value }) => {
    const { theme } = useTheme();

    return (
      <div className="relative border bg-[#f9f9f9] font-sans dark:bg-zinc-950">
        <div className="text-primary flex items-center justify-between px-4 dark:bg-zinc-700">
          <span className="text-xs lowercase">{language}</span>
          <div className="flex items-center space-x-1">
            <CopyButton value={value} />
          </div>
        </div>
        <SyntaxHighlighter
          language={language}
          style={theme === 'light' ? oneLight : oneDark}
          customStyle={{
            margin: 0,
            background: 'transparent',
          }}
          codeTagProps={{
            style: { fontSize: '14px', fontFamily: 'var(--font-mono)' },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  },
);

MessageCodeBlock.displayName = 'MessageCodeBlock';
