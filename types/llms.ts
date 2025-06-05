import type { ModelProvider } from './models';
import type { PluginID } from './plugins';

export const VALID_MODEL_IDS = [
  'mistral-medium',
  'mistral-large',
  'reasoning-model',
] as const;

export type LLMID = (typeof VALID_MODEL_IDS)[number];

export interface LLM {
  modelId: LLMID;
  modelName: string;
  provider: ModelProvider;
  imageInput: boolean;
  shortModelName?: string;
  description: string;
}

export type ModelWithWebSearch = LLMID | `${LLMID}:websearch`;

export type AgentMode = 'auto-run' | 'ask-every-time';

export interface ModelParams {
  isContinuation: boolean;
  isTerminalContinuation: boolean;
  selectedPlugin: PluginID;
  agentMode: AgentMode;
  confirmTerminalCommand: boolean;
  isTemporaryChat: boolean;
  isRegeneration: boolean;
  editSequenceNumber?: number;
}
