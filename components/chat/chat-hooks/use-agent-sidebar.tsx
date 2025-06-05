import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { AgentSidebarState } from '@/types/agent';

interface AgentSidebarContextType {
  agentSidebar: AgentSidebarState;
  setAgentSidebar: React.Dispatch<React.SetStateAction<AgentSidebarState>>;
  resetAgentSidebar: () => void;
}

const AgentSidebarContext = createContext<AgentSidebarContextType | undefined>(
  undefined,
);

export const AgentSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [agentSidebar, setAgentSidebar] = useState<AgentSidebarState>({
    isOpen: false,
    item: null,
  });

  const resetAgentSidebar = () => {
    setAgentSidebar({ isOpen: false, item: null });
  };

  return (
    <AgentSidebarContext.Provider
      value={{ agentSidebar, setAgentSidebar, resetAgentSidebar }}
    >
      {children}
    </AgentSidebarContext.Provider>
  );
};

export const useAgentSidebar = () => {
  const context = useContext(AgentSidebarContext);
  if (!context) {
    throw new Error(
      'useAgentSidebar must be used within an AgentSidebarProvider',
    );
  }
  return context;
};
