import type { BundledLanguage } from 'shiki/bundle/web';
import type { InfoSearchWebBlock } from '@/components/messages/terminal-messages/types';

export type AgentCodeBlockLang = BundledLanguage | 'text' | 'ansi';

export interface AgentSidebarItem {
  action: string;
  filePath: string;
  content: string | InfoSearchWebBlock;
  icon: React.ReactNode;
  lang?: AgentCodeBlockLang;
}

export interface AgentSidebarState {
  isOpen: boolean;
  item: AgentSidebarItem | null;
}
