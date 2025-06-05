import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';
import { handleFileError } from './utils/sandbox-utils';
import {
  FILE_READ_MAX_TOKENS,
  truncateContentByTokens,
} from '../../terminal-utils';

const writeFileContent = async (
  sandbox: any,
  file: string,
  content: string,
  append: boolean,
  leading_newline: boolean,
  trailing_newline: boolean,
  dataStream: any,
): Promise<string> => {
  try {
    dataStream.writeData({
      type: 'agent-status',
      content: append ? 'editing_file' : 'creating_file',
    });

    let finalContent = content;
    let originalContent = '';
    let fileExists = false;

    if (leading_newline) {
      finalContent = `\n${finalContent}`;
    }
    if (trailing_newline) {
      finalContent = `${finalContent}\n`;
    }

    // Check if file exists first
    try {
      originalContent = await sandbox.files.read(file);
      fileExists = true;
    } catch {
      // File doesn't exist yet
      fileExists = false;
    }

    if (append && fileExists) {
      await sandbox.files.write(file, originalContent + finalContent);
    } else {
      await sandbox.files.write(file, finalContent);
    }

    // Determine the operation mode
    let mode;
    if (append) {
      mode = 'append';
    } else if (fileExists) {
      mode = 'overwrite';
    } else {
      mode = 'create';
    }

    // Use a single file-write tag with a mode parameter
    const wrappedContent = `<pgptml:file_write path="${file}" mode="${mode}">${truncateContentByTokens(finalContent, FILE_READ_MAX_TOKENS)}</pgptml:file_write>\n\n`;

    dataStream.writeData({
      type: 'text-delta',
      content: wrappedContent,
    });

    return `Successfully ${mode} file ${file}`;
  } catch (error) {
    return handleFileError(error, 'writing to file');
  }
};

/**
 * Creates a tool for writing content to files
 * @param context - The context needed for tool execution
 * @returns The file write tool
 */
export const createFileWriteTool = (context: ToolContext) => {
  const { dataStream, sandboxManager } = context;

  return tool({
    description:
      'Overwrite or append content to a file. Use for creating new files, appending content, or modifying existing files.',
    parameters: z.object({
      file: z.string().describe('Absolute path of the file to write to'),
      content: z.string().describe('Text content to write'),
      append: z.boolean().optional().describe('Whether to use append mode'),
      leading_newline: z
        .boolean()
        .optional()
        .describe('Whether to add a leading newline'),
      trailing_newline: z
        .boolean()
        .optional()
        .describe('Whether to add a trailing newline'),
    }),
    execute: async (args) => {
      const {
        file,
        content,
        append = false,
        leading_newline = false,
        trailing_newline = false,
      } = args as {
        file: string;
        content: string;
        append?: boolean;
        leading_newline?: boolean;
        trailing_newline?: boolean;
      };

      try {
        if (!sandboxManager) {
          throw new Error('Sandbox manager not initialized');
        }

        const { sandbox } = await sandboxManager.getSandbox();

        return writeFileContent(
          sandbox,
          file,
          content,
          append,
          leading_newline,
          trailing_newline,
          dataStream,
        );
      } catch (error) {
        return handleFileError(error, 'connecting to sandbox');
      }
    },
  });
};
