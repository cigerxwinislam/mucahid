export type ModelProvider = 'openai' | 'hackerai' | 'custom';

export interface RateLimitInfo {
  remaining: number;
  used: number;
  max: number;
  isPremiumUser: boolean;
  timeRemaining?: number;
  message?: string;
}
