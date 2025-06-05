import type { LLM } from '@/types';

export const SmallModel: LLM = {
  modelId: 'mistral-medium',
  modelName: 'Small Model',
  shortModelName: 'Small',
  provider: 'hackerai',
  imageInput: true,
  description: 'Faster for most questions',
};

export const LargeModel: LLM = {
  modelId: 'mistral-large',
  modelName: 'Large Model',
  shortModelName: 'Large',
  provider: 'hackerai',
  imageInput: true,
  description: 'Great for most questions',
};

export const ReasoningModel: LLM = {
  modelId: 'reasoning-model',
  modelName: 'Reasoning Model',
  shortModelName: 'Reason',
  provider: 'hackerai',
  imageInput: false,
  description: 'Uses advanced reasoning',
};

export const HACKERAI_LLM_LIST: LLM[] = [
  SmallModel,
  LargeModel,
  ReasoningModel,
];
