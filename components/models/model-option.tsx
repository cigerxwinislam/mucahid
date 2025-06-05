import type { LLM } from '@/types';
import type { FC } from 'react';
import { ModelIcon } from './model-icon';

interface ModelOptionProps {
  model: LLM;
  onSelect: () => void;
}

export const ModelOption: FC<ModelOptionProps> = ({ model, onSelect }) => {
  return (
    <div
      className="flex w-full cursor-pointer justify-start space-x-3 truncate rounded p-2"
      onClick={onSelect}
    >
      <div className="flex items-center space-x-2">
        <ModelIcon modelId={model.modelId} size={28} />

        <div className="text-sm font-semibold">{model.shortModelName}</div>
      </div>
    </div>
  );
};
