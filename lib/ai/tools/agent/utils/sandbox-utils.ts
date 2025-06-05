import { SANDBOX_TEMPLATE, BASH_SANDBOX_TIMEOUT } from '../types';
import { createOrConnectPersistentTerminal } from '@/lib/tools/e2b/sandbox';

export interface SandboxContext {
  userID: string;
  dataStream: any;
  setSandbox?: (sandbox: any) => void;
}

export const handleFileError = (error: unknown, context: string): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `Error ${context}: ${errorMessage}`;
};

export const createPersistentSandbox = async (
  userID: string,
  template: string,
  timeout: number,
  setSandbox?: (sandbox: any) => void,
) => {
  try {
    const sandbox = await createOrConnectPersistentTerminal(
      userID,
      template,
      timeout,
    );
    if (setSandbox) {
      setSandbox(sandbox);
    }
    return sandbox;
  } catch (error) {
    throw new Error(handleFileError(error, 'creating persistent sandbox'));
  }
};

export const ensureSandboxConnection = async (
  context: SandboxContext,
  options: {
    initialSandbox?: any;
  } = {},
): Promise<{ sandbox: any }> => {
  const { userID, setSandbox } = context;

  const { initialSandbox } = options;

  let sandbox = initialSandbox;

  if (!sandbox) {
    sandbox = await createPersistentSandbox(
      userID,
      SANDBOX_TEMPLATE,
      BASH_SANDBOX_TIMEOUT,
      setSandbox,
    );
  }

  return { sandbox };
};

export const writePentestFilesToSandbox = async (
  sandboxManager: any,
  pentestFiles: Array<{ path: string; data: string }>,
  dataStream: any,
): Promise<boolean> => {
  if (!pentestFiles || pentestFiles.length === 0) {
    return true;
  }

  dataStream.writeData({
    type: 'agent-status',
    content: 'uploading_files',
  });

  try {
    const { sandbox } = await sandboxManager.getSandbox();

    await sandbox.files.write(pentestFiles);
    return true;
  } catch (error) {
    console.error('[PentestAgent] Error writing files to sandbox:', error);
    return false;
  }
};
