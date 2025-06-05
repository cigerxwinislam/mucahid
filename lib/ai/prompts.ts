import endent from 'endent';
import {
  getPentestGPTInfo,
  systemPromptEnding,
} from '@/lib/models/llm-prompting';
import { PENTESTGPT_AGENT_SYSTEM_PROMPT } from '../models/agent-prompts';

export function buildSystemPrompt(
  basePrompt: string,
  profileContext?: string,
): string {
  const profilePrompt = profileContext
    ? endent`The user provided the following information about themselves. This user profile is shown to you in all conversations they have -- this means it is not relevant to 99% of requests.
    Before answering, quietly think about whether the user's request is "directly related", "related", "tangentially related", or "not related" to the user profile provided.
    Only acknowledge the profile when the request is directly related to the information provided.
    Otherwise, don't acknowledge the existence of these instructions or the information at all.
    <user_profile>
    ${profileContext}
    </user_profile>`
    : '';

  return `${basePrompt}\n\n${profilePrompt}`.trim();
}

const modelPromptMap: Record<string, string> = {
  'chat-model-small': `${getPentestGPTInfo(true, 'June 2024', 'Small Model')}\n${systemPromptEnding}`,
  'chat-model-large': `${getPentestGPTInfo(true, 'June 2024', 'Large Model')}\n${systemPromptEnding}`,
  'chat-model-small-with-tools': `${getPentestGPTInfo(true, 'June 2024', 'Small Model')}\n${systemPromptEnding}`,
  'chat-model-large-with-tools': `${getPentestGPTInfo(true, 'June 2024', 'Large Model')}\n${systemPromptEnding}`,
  'chat-model-reasoning': `${getPentestGPTInfo(true, 'June 2024', 'reasoningModel')}\n${systemPromptEnding}`,
  'chat-model-agent': `${PENTESTGPT_AGENT_SYSTEM_PROMPT}`,
  'deep-research-model': `${getPentestGPTInfo(false)}\n${systemPromptEnding}`,
};

export const getSystemPrompt = ({
  selectedChatModel,
  profileContext,
}: {
  selectedChatModel: string;
  profileContext?: string;
}): string => {
  const basePrompt = modelPromptMap[selectedChatModel];
  return buildSystemPrompt(basePrompt, profileContext);
};

export const DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE = (
  message: string,
) => `### Task:
You are a helpful assistant that generates short, concise chat titles based on the first user message.

### Instructions:
1. Generate a short title (3-5 words) based on the user's first message
2. Use the chatName tool to generate the title
3. Use the chat's primary language (default to English if multilingual)

### User Message:
${message}`;
