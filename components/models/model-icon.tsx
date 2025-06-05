import { cn } from '@/lib/utils';
import type { LLMID } from '@/types';
import { Sparkles, Sparkle, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { FC, HTMLAttributes } from 'react';
import { SmallModel, LargeModel } from '@/lib/models/hackerai-llm-list';

interface ModelIconProps extends HTMLAttributes<HTMLDivElement> {
  modelId: LLMID | 'custom';
  size: number;
}

export const iconMap = {
  [SmallModel.modelId]: Zap,
  [LargeModel.modelId]: Sparkle,
  default: Sparkles,
};

export const ModelIcon: FC<ModelIconProps> = ({ modelId, size, ...props }) => {
  const { theme } = useTheme();
  const IconComponent = iconMap[modelId] || iconMap.default;
  const className = cn(
    'rounded-sm bg-white p-0.5 text-black',
    props.className,
    theme === 'dark' ? 'bg-white' : 'border border-black',
  );

  return <IconComponent className={className} size={size} />;
};
