import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

/**
 * Creates a tool for exposing local ports for temporary public access
 * @param context - The context needed for tool execution
 * @returns The port exposure tool
 */
export const createDeployExposePortTool = (context: ToolContext) => {
  const { sandboxManager } = context;

  return tool({
    description:
      'Expose specified local port for temporary public access. Use when providing temporary public access for services.',
    parameters: z.object({
      port: z.number().describe('Local port number to expose'),
    }),
    execute: async ({ port }) => {
      if (!sandboxManager) {
        throw new Error('Sandbox manager not initialized');
      }

      const { sandbox } = await sandboxManager.getSandbox();

      const host = sandbox.getHost(port);
      const publicUrl = `https://${host}`;

      const message = `Port ${port} has been successfully exposed. Public URL: ${publicUrl}`;
      return message;
    },
  });
};
