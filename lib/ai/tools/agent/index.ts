import type { ToolContext } from './types';
import { createShellExecTool } from './shell-exec-tool';
import { createAskShellExecTool } from './ask-shell-exec-tool';
import { createMessageNotifyTool } from './message-notify-tool';
import { createMessageAskTool } from './message-ask-tool';
import { createFileWriteTool } from './file-write-tool';
import { createFileReadTool } from './file-read-tool';
import { createIdleTool } from './idle-tool';
import { createShellWaitTool } from './shell-wait-tool';
import { createFileStrReplaceTool } from './file-str-replace-tool';
import { createWebSearchTool } from './web-search-tool';
import { createDeployExposePortTool } from './deploy-expose-port-tool';
import { createShellBackgroundTool } from './shell-background-tool';

/**
 * Creates and returns all agent tools with the provided context
 * @param context - The context needed for tool execution
 * @returns Object containing all available agent tools
 */
export function createAgentTools(context: ToolContext) {
  const { agentMode } = context;

  return {
    shell_exec:
      agentMode === 'ask-every-time'
        ? createAskShellExecTool()
        : createShellExecTool(context),
    shell_wait: createShellWaitTool(context),
    message_notify_user: createMessageNotifyTool(context),
    message_ask_user: createMessageAskTool(),
    file_write: createFileWriteTool(context),
    file_str_replace: createFileStrReplaceTool(context),
    file_read: createFileReadTool(context),
    info_search_web: createWebSearchTool(context),
    shell_background: createShellBackgroundTool(context),
    deploy_expose_port: createDeployExposePortTool(context),
    idle: createIdleTool(),
  };
}
