import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';
import { executeTerminalCommand } from '@/lib/tools/e2b/terminal-executor';
import { streamTerminalOutput } from '@/lib/ai/terminal-utils';
import PostHogClient from '@/app/posthog';

/**
 * Creates a tool for executing commands in the background
 * @param context - The context needed for tool execution
 * @returns The background command execution tool
 */
export const createShellBackgroundTool = (context: ToolContext) => {
  const { dataStream, userID, sandboxManager } = context;

  return tool({
    description:
      'Execute commands in the background of the sandbox environment. Use for long-running processes or services that need to continue running.',
    parameters: z.object({
      exec_dir: z
        .string()
        .describe(
          'Working directory for command execution (must use absolute path)',
        ),
      command: z.string().describe('Shell command to execute in background'),
    }),
    execute: async (args) => {
      const { exec_dir, command } = args as {
        exec_dir: string;
        command: string;
      };

      if (!sandboxManager) {
        throw new Error('Sandbox manager not initialized');
      }

      // Get sandbox from manager
      const { sandbox } = await sandboxManager.getSandbox();

      const posthog = PostHogClient();
      if (posthog) {
        posthog.capture({
          distinctId: userID,
          event: 'terminal_background_executed',
        });
      }

      dataStream.writeData({
        type: 'agent-status',
        content: 'terminal',
      });

      dataStream.writeData({
        type: 'text-delta',
        content: `<pgptml:terminal_command exec-dir="${exec_dir}" background="true">${command}</pgptml:terminal_command>`,
      });

      // Execute command in background
      const terminalStream = await executeTerminalCommand({
        userID,
        command,
        exec_dir,
        sandbox,
        background: true,
      });

      const terminalOutput = await streamTerminalOutput(
        terminalStream,
        dataStream,
      );

      return terminalOutput;
    },
  });
};
