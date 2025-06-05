import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { perplexity } from '@ai-sdk/perplexity';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4.1-mini-2025-04-14'),
    'chat-model-large': openai('gpt-4.1-2025-04-14'),
    'chat-model-small-with-tools': openai('gpt-4.1-mini-2025-04-14', {
      parallelToolCalls: false,
    }),
    'chat-model-large-with-tools': openai('gpt-4.1-2025-04-14', {
      parallelToolCalls: false,
    }),
    'chat-model-agent': openai('gpt-4.1-2025-04-14', {
      parallelToolCalls: false,
    }),
    'browser-model': openai('gpt-4.1-mini-2025-04-14'),
    'chat-model-reasoning': wrapLanguageModel({
      model: openrouter('x-ai/grok-3-mini-beta', {
        extraBody: {
          reasoning: { effort: 'high' },
        },
      }),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'deep-research-model': wrapLanguageModel({
      model: perplexity('sonar-deep-research'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
  },
});
