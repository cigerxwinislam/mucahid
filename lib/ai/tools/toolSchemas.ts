import { executeWebSearchTool } from './web-search';
import { executeBrowserTool } from './browser';
import { z } from 'zod';
import type { LLMID, ModelParams } from '@/types/llms';
import type { ChatMetadata } from '@/types';
import type { Doc } from '@/convex/_generated/dataModel';

export const createToolSchemas = ({
  chat,
  messages,
  modelParams,
  chatMetadata,
  profile,
  dataStream,
  abortSignal,
  model,
  userCountryCode,
  initialChatPromise,
  assistantMessageId,
}: {
  chat: Doc<'chats'> | null;
  messages: any;
  modelParams: ModelParams;
  chatMetadata: ChatMetadata;
  profile: any;
  dataStream: any;
  abortSignal: AbortSignal;
  model: LLMID;
  userCountryCode: string | null;
  initialChatPromise: Promise<void>;
  assistantMessageId: string;
}) => {
  const allSchemas = {
    browser: {
      description: `Use the browser tool to open a specific URL and extract its content. \
Some examples of when to use the browser tool include:
- When the user explicitly requests to visit, open, browse, or view a specific webpage or URL.
- When the user directly instructs you to access a specific website they've mentioned.
- When performing security testing, vulnerability assessment, or penetration testing of a website.

Do not use browser tool for general information queries that can be answered without visiting a URL.
Do not use browser tool if the user merely mentions a URL without explicitly asking you to open it.
The browser tool cannot IP addresses (like http://192.168.1.1), or non-standard URLs.

The browser tool can extract content in two formats:
- markdown: Use for general content reading and information extraction (default).
- html: Use for security testing, vulnerability assessment, and penetration testing to analyze HTML \
structure, forms, scripts, and potential security issues. Also use when HTML content would be more \
beneficial for the user's needs.`,
      parameters: z.object({
        open_url: z.string().url().describe('The URL of the webpage to open'),
        format_output: z
          .enum(['markdown', 'html'])
          .default('markdown')
          .describe('The format of the output content.'),
      }),
      execute: async ({
        open_url,
        format_output = 'markdown',
      }: { open_url: string; format_output?: 'markdown' | 'html' }) => {
        // Ensure format_output is either markdown or html
        const safeFormat = format_output === 'html' ? 'html' : 'markdown';
        return executeBrowserTool({
          open_url,
          format_output: safeFormat,
          config: {
            profile,
            chat,
            messages,
            modelParams,
            dataStream,
            abortSignal,
            chatMetadata,
            model,
            userCountryCode,
            initialChatPromise,
            assistantMessageId,
          },
        });
      },
    },
    webSearch: {
      description: `Use the webSearch tool to access up-to-date information from the web \
or when responding to the user requires information about their location. \
Some examples of when to use the webSearch tool include:

- Local Information: Use the \`webSearch\` tool to respond to questions that require information \
about the user's location, such as the weather, local businesses, or events.
- Freshness: If up-to-date information on a topic could potentially change or enhance the answer, \
call the \`webSearch\` tool any time you would otherwise refuse to answer a question because your \
knowledge might be out of date.
- Niche Information: If the answer would benefit from detailed information not widely known or understood \
(which might be found on the internet), such as details about a small neighborhood, a less well-known \
company, or arcane regulations, use web sources directly rather than relying on the distilled knowledge \
from pretraining.
- Accuracy: If the cost of a small mistake or outdated information is high (e.g., using an outdated \
version of a software library or not knowing the date of the next game for a sports team), then use the \
\`webSearch\` tool.`,
      parameters: z.object({
        search: z.boolean().describe('Set to true to search the web'),
      }),
      execute: async () => {
        return executeWebSearchTool({
          config: {
            chat,
            messages,
            modelParams,
            profile,
            dataStream,
            isLargeModel: true,
            abortSignal,
            chatMetadata,
            model,
            userCountryCode,
            initialChatPromise,
            assistantMessageId,
          },
        });
      },
    },
    terminal: {
      description: `Run terminal commands. Select this tool IMMEDIATELY when any terminal operations are needed, don't say or plan anything before selecting this tool.

This tool executes terminal commands in a Debian GNU/Linux 12 environment with root privileges. Use this tool when:
1. The user requests to run any command or script
2. The user needs to perform network scanning, enumeration, or other security testing
3. Any task that will benefit from the use of a terminal`,
      parameters: z.object({
        terminal: z
          .boolean()
          .describe(
            'Set to true to use the terminal for executing terminal commands. Select immediately when terminal operations are needed.',
          ),
      }),
    },
  };

  type SchemaKey = keyof typeof allSchemas;

  return {
    allSchemas,
    getSelectedSchemas: (selectedTool: string | string[]) => {
      if (
        selectedTool === 'all' ||
        !selectedTool ||
        selectedTool.length === 0
      ) {
        return allSchemas;
      }
      if (typeof selectedTool === 'string') {
        return selectedTool in allSchemas
          ? {
              [selectedTool as SchemaKey]:
                allSchemas[selectedTool as SchemaKey],
            }
          : {};
      }
      return Object.fromEntries(
        Object.entries(allSchemas).filter(([key]) =>
          selectedTool.includes(key),
        ),
      );
    },
  };
};
