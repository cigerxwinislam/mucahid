export interface MessageTerminalProps {
  content: string;
  isAssistant: boolean;
  isLastMessage: boolean;
}

export interface TerminalBlock {
  command: string;
  stdout: string;
  error?: string;
  exec_dir?: string;
}

export interface ShellWaitBlock {
  seconds: string;
}

export interface FileContentBlock {
  path: string;
  content: string;
  mode?: 'read' | 'create' | 'append' | 'overwrite';
}

export interface InfoSearchWebBlock {
  query: string;
  results: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

export type ContentBlock =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'terminal';
      content: TerminalBlock;
    }
  | {
      type: 'shell-wait';
      content: ShellWaitBlock;
    }
  | {
      type: 'file-content';
      content: FileContentBlock;
    }
  | {
      type: 'info-search-web';
      content: InfoSearchWebBlock;
    };

export interface ShowMoreButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  remainingLines: number;
  icon?: React.ReactNode;
}

export const MAX_VISIBLE_LINES = 12;
export const COMMAND_LENGTH_THRESHOLD = 40; // Threshold for when to switch to full terminal view
