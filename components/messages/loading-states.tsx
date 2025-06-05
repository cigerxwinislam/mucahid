import { PluginID } from '@/types/plugins';
import { useUIContext } from '@/context/ui-context';
import {
  FileText,
  Puzzle,
  Globe,
  Atom,
  SquareTerminal,
  Search,
  Circle,
} from 'lucide-react';

export const loadingStates = {
  none: {
    icon: <Circle size={20} fill="currentColor" className="animate-pulse" />,
    text: '',
  },
  retrieval: {
    icon: <FileText size={20} />,
    text: 'Reading documents...',
  },
  thinking: {
    icon: <Atom size={20} />,
    text: 'Thinking...',
  },
  [PluginID.WEB_SEARCH]: {
    icon: <Globe size={20} />,
    text: 'Searching the web...',
  },
  [PluginID.BROWSER]: {
    icon: <Globe size={20} />,
    text: 'Browsing the web...',
  },
  [PluginID.DEEP_RESEARCH]: {
    icon: <Search size={20} />,
    text: 'Researching... (takes 1-5 minutes)',
  },

  [PluginID.PENTEST_AGENT]: {
    icon: <SquareTerminal size={20} />,
    text: 'Using pentest agent...',
  },
};

export const LoadingState = ({
  isLastMessage,
  isAssistant,
}: { isLastMessage: boolean; isAssistant: boolean }) => {
  const { firstTokenReceived, isGenerating, toolInUse } = useUIContext();

  if (!isLastMessage || !isAssistant || firstTokenReceived || !isGenerating)
    return null;

  const { icon, text } = loadingStates[
    toolInUse as keyof typeof loadingStates
  ] || {
    icon: <Puzzle size={20} />,
    text: `Using ${toolInUse}...`,
  };

  if (!text && toolInUse === 'none') {
    return icon;
  }

  return (
    <div className="flex animate-pulse items-center space-x-2">
      {icon}
      <div>{text}</div>
    </div>
  );
};
