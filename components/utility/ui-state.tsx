'use client';

import { UIContext } from '@/context/ui-context';
import { PluginID } from '@/types/plugins';
import { type FC, useEffect, useState } from 'react';
import { useLocalStorageState } from '@/lib/hooks/use-local-storage-state';
import type { AgentStatusState } from '../messages/agent-status';

const MOBILE_BREAKPOINT = 768;

interface UIStateProps {
  children: React.ReactNode;
}

export const UIState: FC<UIStateProps> = ({ children }) => {
  // Tools
  const [selectedPluginType, setSelectedPluginType] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState(PluginID.NONE);

  // UI States
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  const [isReadyToChat, setIsReadyToChat] = useState(true);
  const [showSidebar, setShowSidebar] = useLocalStorageState(
    'showSidebar',
    false,
  );

  // Tools
  const [toolInUse, setToolInUse] = useState('none');

  // Agent states
  const [agentStatus, setAgentStatus] = useState<AgentStatusState | null>(null);

  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  // Handle mobile detection using matchMedia
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <UIContext.Provider
      value={{
        // Tools
        selectedPluginType,
        setSelectedPluginType,
        selectedPlugin,
        setSelectedPlugin,

        // UI States
        isMobile: !!isMobile,
        isReadyToChat,
        setIsReadyToChat,
        showSidebar,
        setShowSidebar,

        // Tools
        toolInUse,
        setToolInUse,

        // Agent states
        agentStatus,
        setAgentStatus,

        // Loading States
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
