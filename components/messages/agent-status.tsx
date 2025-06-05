import { useUIContext } from '@/context/ui-context';

/**
 * Represents the different states an agent can be in during execution
 */
export enum AgentStatusState {
  THINKING = 'thinking',
  TERMINAL = 'terminal',
  UPLOADING_FILES = 'uploading_files',
  CREATING_FILE = 'creating_file',
  EDITING_FILE = 'editing_file',
  FILE_READ = 'file_read',
  WEB_SEARCH = 'websearch',
  BROWSER = 'browser',
  SHELL_WAIT = 'shell_wait',
  SHELL_KILL_PROCESS = 'shell_kill_process',
}

/**
 * Human-readable descriptions for each agent state
 */
export const AgentStatusLabels: Record<AgentStatusState, string> = {
  [AgentStatusState.THINKING]: 'Thinking',
  [AgentStatusState.TERMINAL]: 'Using terminal',
  [AgentStatusState.UPLOADING_FILES]: 'Uploading files',
  [AgentStatusState.CREATING_FILE]: 'Creating file',
  [AgentStatusState.EDITING_FILE]: 'Editing file',
  [AgentStatusState.FILE_READ]: 'Reading file',
  [AgentStatusState.WEB_SEARCH]: 'Searching the web',
  [AgentStatusState.BROWSER]: 'Browsing the web',
  [AgentStatusState.SHELL_WAIT]: 'Waiting for terminal',
  [AgentStatusState.SHELL_KILL_PROCESS]: 'Terminating process',
};

/**
 * Color configurations for different agent states
 */
const AgentStatusColors: Record<
  AgentStatusState,
  { ping: string; base: string }
> = {
  [AgentStatusState.THINKING]: {
    ping: 'bg-blue-400',
    base: 'bg-blue-500',
  },
  [AgentStatusState.TERMINAL]: {
    ping: 'bg-amber-400',
    base: 'bg-amber-500',
  },
  [AgentStatusState.CREATING_FILE]: {
    ping: 'bg-green-400',
    base: 'bg-green-500',
  },
  [AgentStatusState.FILE_READ]: {
    ping: 'bg-purple-400',
    base: 'bg-purple-500',
  },
  [AgentStatusState.WEB_SEARCH]: {
    ping: 'bg-red-400',
    base: 'bg-red-500',
  },
  [AgentStatusState.BROWSER]: {
    ping: 'bg-orange-400',
    base: 'bg-orange-500',
  },
  [AgentStatusState.SHELL_WAIT]: {
    ping: 'bg-yellow-400',
    base: 'bg-yellow-500',
  },
  [AgentStatusState.SHELL_KILL_PROCESS]: {
    ping: 'bg-red-400',
    base: 'bg-red-500',
  },
  [AgentStatusState.EDITING_FILE]: {
    ping: 'bg-pink-400',
    base: 'bg-pink-500',
  },
  [AgentStatusState.UPLOADING_FILES]: {
    ping: 'bg-gray-400',
    base: 'bg-gray-500',
  },
};

/**
 * Helper function to check if a value is a valid AgentStatusState
 */
const isValidAgentStatus = (
  state: string | null,
): state is AgentStatusState => {
  if (!state) return false;
  return Object.values(AgentStatusState).includes(state as AgentStatusState);
};

export const AgentStatus = ({
  isLastMessage,
  isAssistant,
}: { isLastMessage: boolean; isAssistant: boolean }) => {
  const { isGenerating, agentStatus } = useUIContext();

  if (
    agentStatus === null ||
    !isValidAgentStatus(agentStatus) ||
    !isGenerating ||
    !isLastMessage ||
    !isAssistant
  ) {
    return null;
  }

  const text = AgentStatusLabels[agentStatus];
  const colors = AgentStatusColors[agentStatus];

  return (
    <div className="mt-2 flex items-center space-x-3 text-sm">
      <div className="relative flex size-3">
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full ${colors.ping} opacity-75`}
        />
        <span
          className={`relative inline-flex size-3 rounded-full ${colors.base}`}
        />
      </div>
      <div>{text}</div>
    </div>
  );
};
