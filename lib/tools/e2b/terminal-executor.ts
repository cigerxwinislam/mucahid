import type { Sandbox } from '@e2b/code-interpreter';

const MAX_COMMAND_EXECUTION_TIME = 6 * 60 * 1000;
// 30 seconds
const STREAM_TIMEOUT = 30 * 1000;
const ENCODER = new TextEncoder();

interface ExecutionError {
  name: string;
  stderr?: string;
  value?: string;
  result?: {
    stderr?: string;
    stdout?: string;
    exitCode?: number;
    error?: string;
  };
}

export const executeTerminalCommand = async ({
  userID,
  command,
  exec_dir,
  sandbox = null,
  background = false,
}: {
  userID: string;
  command: string;
  exec_dir: string;
  sandbox?: Sandbox | null;
  background?: boolean;
}): Promise<ReadableStream<Uint8Array>> => {
  let hasTerminalOutput = false;
  let currentBlock: 'stdout' | null = null;
  let timeoutId: NodeJS.Timeout;
  let isStreamClosed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Reset state for new command
      hasTerminalOutput = false;
      if (currentBlock) {
        controller.enqueue(ENCODER.encode('\n```'));
        currentBlock = null;
      }

      try {
        if (!sandbox) {
          throw new Error('Failed to create or connect to sandbox');
        }

        // Set up custom timeout only if not running in background
        if (!background) {
          timeoutId = setTimeout(() => {
            if (!isStreamClosed) {
              // Close any open block before sending timeout message
              if (currentBlock) {
                controller.enqueue(ENCODER.encode('\n```'));
                currentBlock = null;
              }
              controller.enqueue(
                ENCODER.encode(
                  `<terminal-error>The command's output stream has been paused after ${STREAM_TIMEOUT / 1000} seconds. The command will continue running in the background.</terminal-error>`,
                ),
              );
              controller.close();
              isStreamClosed = true;
            }
          }, STREAM_TIMEOUT);
        }

        const execution = background
          ? await sandbox.commands.run(command, {
              timeoutMs: MAX_COMMAND_EXECUTION_TIME,
              background: true,
              cwd: exec_dir,
              onStdout: (data: string) => {
                if (isStreamClosed) return;
                hasTerminalOutput = true;
                if (currentBlock !== 'stdout') {
                  if (currentBlock) {
                    controller.enqueue(ENCODER.encode('\n```'));
                  }
                  controller.enqueue(ENCODER.encode('\n```stdout\n'));
                  currentBlock = 'stdout';
                }
                controller.enqueue(ENCODER.encode(data));
              },
              onStderr: (data: string) => {
                if (isStreamClosed) return;
                hasTerminalOutput = true;
                if (currentBlock !== 'stdout') {
                  if (currentBlock) {
                    controller.enqueue(ENCODER.encode('\n```'));
                  }
                  controller.enqueue(ENCODER.encode('\n```stdout\n'));
                  currentBlock = 'stdout';
                }
                controller.enqueue(ENCODER.encode(data));
              },
            })
          : await sandbox.commands.run(command, {
              timeoutMs: MAX_COMMAND_EXECUTION_TIME,
              cwd: exec_dir,
              user: 'root',
              onStdout: (data: string) => {
                if (isStreamClosed) return;
                hasTerminalOutput = true;
                if (currentBlock !== 'stdout') {
                  if (currentBlock) {
                    controller.enqueue(ENCODER.encode('\n```'));
                  }
                  controller.enqueue(ENCODER.encode('\n```stdout\n'));
                  currentBlock = 'stdout';
                }
                controller.enqueue(ENCODER.encode(data));
              },
              onStderr: (data: string) => {
                if (isStreamClosed) return;
                hasTerminalOutput = true;
                if (currentBlock !== 'stdout') {
                  if (currentBlock) {
                    controller.enqueue(ENCODER.encode('\n```'));
                  }
                  controller.enqueue(ENCODER.encode('\n```stdout\n'));
                  currentBlock = 'stdout';
                }
                controller.enqueue(ENCODER.encode(data));
              },
            });

        // Clear the timeout if command completes before timeout
        if (!background) {
          clearTimeout(timeoutId);
        }

        // Handle empty output
        if (!hasTerminalOutput && !isStreamClosed && !execution.error) {
          if (currentBlock !== 'stdout') {
            controller.enqueue(ENCODER.encode('\n```stdout\n'));
            currentBlock = 'stdout';
          }
          controller.enqueue(
            ENCODER.encode(
              'Command ran successfully and did not produce any output.',
            ),
          );
        }

        // Close any open block at the end
        if (currentBlock && !isStreamClosed) {
          controller.enqueue(ENCODER.encode('\n```'));
          currentBlock = null;
        }

        // Handle any execution errors
        if (execution.error && !isStreamClosed) {
          console.error(`[${userID}] Execution error:`, execution.error);
          const error =
            typeof execution.error === 'object'
              ? (execution.error as ExecutionError)
              : { name: 'UnknownError' };
          const errorMessage = error.name.includes('TimeoutError')
            ? `Command timed out after ${MAX_COMMAND_EXECUTION_TIME / 1000} seconds. Try a shorter command or split it.`
            : error.result?.stderr ||
              error.stderr ||
              error.value ||
              'Unknown error';
          controller.enqueue(
            ENCODER.encode(`<terminal-error>${errorMessage}</terminal-error>`),
          );
        }
      } catch (error) {
        if (!isStreamClosed) {
          if (error instanceof Error && isConnectionError(error)) {
            // Close any open block before sending error message
            if (currentBlock) {
              controller.enqueue(ENCODER.encode('\n```'));
              currentBlock = null;
            }
            controller.enqueue(
              ENCODER.encode(
                `<terminal-error>The Terminal is currently unavailable. Our team is working on a fix. Please try again later.</terminal-error>`,
              ),
            );
          } else if (
            error instanceof Error &&
            error.name === 'CommandExitError'
          ) {
            const exitError = error as ExecutionError;
            // Only show exit error if there's no stderr output
            if (!exitError.result?.stderr) {
              const errorMessage = exitError.result?.error || 'Command failed';
              controller.enqueue(
                ENCODER.encode(
                  `<terminal-error>${errorMessage}</terminal-error>`,
                ),
              );
            }
          }
        }
      } finally {
        // Clear timeout in case it's still pending
        if (!background) {
          clearTimeout(timeoutId);
        }
        // Ensure any open block is closed before ending the stream
        if (currentBlock && !isStreamClosed) {
          controller.enqueue(ENCODER.encode('\n```'));
          currentBlock = null;
        }
        if (!isStreamClosed) {
          controller.close();
        }
      }
    },
  });

  return stream;
};

function isConnectionError(error: Error): boolean {
  return (
    (error.name === 'TimeoutError' &&
      error.message.includes('Cannot connect to sandbox')) ||
    error.message.includes('503 Service Unavailable') ||
    error.message.includes('504 Gateway Timeout') ||
    error.message.includes('502 Bad Gateway')
  );
}
