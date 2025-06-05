import { tool } from 'ai';
import { z } from 'zod';

/**
 * Creates a tool for asking the user a question and waiting for a response
 * @returns The message ask tool
 */
export const createMessageAskTool = () => {
  return tool({
    description: `Ask user a question and wait for response. Use for requesting clarification, asking for confirmation, or gathering additional information.`,
    parameters: z.object({
      text: z.string().describe('Question text to present to user'),
      attachments: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional()
        .describe(
          '(Optional) List of attachments to show to user, should be file paths',
        ),
    }),
    // no execute function - invoking it will terminate the agent
  });
};
