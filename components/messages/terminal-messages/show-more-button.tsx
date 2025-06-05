import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface ShowMoreButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  remainingCount: number;
  type?: 'lines' | 'results';
  icon?: React.ReactNode;
}

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  isExpanded,
  onClick,
  remainingCount,
  type = 'lines',
  icon,
}) => (
  <div className="flex justify-center py-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-muted-foreground"
      onClick={onClick}
    >
      {isExpanded ? (
        <>
          {icon || <ArrowUp size={14} className="mr-1" />}
          Show Less
        </>
      ) : (
        <>
          {icon || <ArrowDown size={14} className="mr-1" />}
          Show More ({remainingCount} more {type})
        </>
      )}
    </Button>
  </div>
);
