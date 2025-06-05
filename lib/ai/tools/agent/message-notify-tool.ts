import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';
import { handleMessageAttachments } from './utils/file-db-utils';

/**
 * Creates a tool for sending messages to the user without requiring a response
 * @param context - The context needed for tool execution
 * @returns The message notification tool
 */
export const createMessageNotifyTool = (context: ToolContext) => {
  const { dataStream, userID, sandboxManager } = context;

  return tool({
    description: `Send a message to user without requiring a response. Use for acknowledging receipt of messages, providing progress updates, reporting task completion, or explaining changes in approach.`,
    parameters: z.object({
      text: z.string().describe('Message text to display to user'),
      attachments: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional()
        .describe(
          '(Optional) List of attachments to show to user, should be file paths',
        ),
    }),
    execute: async ({ text, attachments }) => {
      dataStream.writeData({
        type: 'text-delta',
        content: `${text}\n\n`,
      });

      // Handle attachments if provided
      if (attachments) {
        if (!sandboxManager) {
          throw new Error('Sandbox manager not initialized');
        }

        await handleMessageAttachments({
          attachments,
          userID,
          dataStream,
          sandboxManager,
        });
      }

      return null;
    },
  });
};
