import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';

export function CopyButton({
  value,
  variant = 'link',
  className,
}: {
  value: string;
  variant?: 'link' | 'outline';
  className?: string;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  return (
    <Button
      size={'icon'}
      className={cn('size-4 text-red-800 hover:opacity-50', className)}
      variant={variant}
      onClick={() => {
        if (isCopied) return;
        copyToClipboard(value);
      }}
    >
      {isCopied ? (
        <Check strokeWidth={1.5} size={16} />
      ) : (
        <Copy strokeWidth={1.5} size={16} />
      )}
    </Button>
  );
}
