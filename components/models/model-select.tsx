import { PentestGPTContext } from '@/context/context';
import type { LLMID } from '@/types';
import { Circle, CircleCheck } from 'lucide-react';
import { type FC, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModelIcon } from './model-icon';
import { Button } from '../ui/button';
import { LLM_LIST } from '@/lib/models/llm-list';
import {
  LargeModel,
  ReasoningModel,
  SmallModel,
} from '@/lib/models/hackerai-llm-list';

interface ModelSelectProps {
  selectedModelId: LLMID;
  onSelectModel: (modelId: LLMID) => void;
}

export const ModelSelect: FC<ModelSelectProps> = ({
  selectedModelId,
  onSelectModel,
}) => {
  const router = useRouter();
  const { isPremiumSubscription, profile } = useContext(PentestGPTContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // FIX: hacky
    }
  }, [isOpen]);

  const handleSelectModel = (modelId: LLMID) => {
    onSelectModel(modelId);
    setIsOpen(false);
  };

  // Define the specific order of models
  const modelOrder: LLMID[] = [
    LargeModel.modelId,
    SmallModel.modelId,
    ReasoningModel.modelId,
  ];

  // Sort the models based on the predefined order
  const sortedModels = LLM_LIST.sort((a, b) => {
    const indexA = modelOrder.indexOf(a.modelId as LLMID);
    const indexB = modelOrder.indexOf(b.modelId as LLMID);
    return indexA - indexB;
  });

  if (!profile) return null;

  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  const freeUserModels = [
    {
      modelId: LargeModel.modelId,
      modelName: 'PentestGPT Pro',
      description: 'Our smartest model & more',
      isUpgrade: true,
    },
    {
      modelId: SmallModel.modelId,
      modelName: 'PentestGPT',
      description: 'Great for everyday tasks',
    },
  ];

  return (
    <div className="flex size-full flex-col">
      <div className="space-y-1 overflow-y-auto p-3">
        {!isPremiumSubscription ? (
          freeUserModels.map((model) => (
            <div key={model.modelId}>
              <div
                className="hover:bg-select flex cursor-pointer items-center justify-between space-x-2 rounded-md p-2"
                onClick={() =>
                  model.isUpgrade
                    ? handleUpgradeClick()
                    : handleSelectModel(model.modelId)
                }
              >
                <div className="flex items-center space-x-2">
                  <ModelIcon modelId={model.modelId} size={28} />
                  <div>
                    <div className="text-sm font-medium">{model.modelName}</div>
                    <div className="text-muted-foreground text-xs">
                      {model.description}
                    </div>
                  </div>
                </div>
                {model.isUpgrade ? (
                  <Button variant="default" size="sm" className="h-7 text-xs">
                    Upgrade
                  </Button>
                ) : selectedModelId === model.modelId ? (
                  <CircleCheck size={22} />
                ) : (
                  <Circle size={22} className="text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="px-2 py-1 text-sm font-light text-muted-foreground">
              Model
            </div>
            <div className="space-y-2">
              {sortedModels.map((model) => (
                <div
                  key={model.modelId}
                  className="hover:bg-accent flex w-full cursor-pointer items-center space-x-3 truncate rounded p-2"
                  onClick={() => handleSelectModel(model.modelId)}
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {model.modelName}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {model.description}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {selectedModelId === model.modelId ? (
                      <CircleCheck size={22} />
                    ) : (
                      <Circle size={22} className="opacity-50" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
