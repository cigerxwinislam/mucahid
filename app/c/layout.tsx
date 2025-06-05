'use client';

import { Dashboard } from '@/components/ui/dashboard';
import { PentestGPTContext } from '@/context/context';
import { useUIContext } from '@/context/ui-context';
import { getChatsByUserId } from '@/db/chats';
import { LargeModel, SmallModel } from '@/lib/models/hackerai-llm-list';
import { useRouter } from 'next/navigation';
import { type ReactNode, useContext, useEffect, useState } from 'react';
import Loading from '../loading';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

const fetchWorkspaceData = async (
  userId: string,
  setChats: (chats: any[]) => void,
  setChatsCursor: (cursor: string | null) => void,
  setChatsIsDone: (isDone: boolean) => void,
) => {
  try {
    const result = await getChatsByUserId(userId);

    setChats(result.chats);
    setChatsCursor(result.continueCursor);
    setChatsIsDone(result.isDone);

    return true;
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    return false;
  }
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Destructure all context values in a single statement
  const {
    setChatSettings,
    setChats,
    setChatsCursor,
    setChatsIsDone,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    user,
    subscriptionStatus,
    subscriptionLoaded,
  } = useContext(PentestGPTContext);

  const { setIsGenerating, setFirstTokenReceived } = useUIContext();

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        // Use subscription status from context instead of fetching again
        const modelId =
          subscriptionStatus !== 'free'
            ? LargeModel.modelId
            : SmallModel.modelId;

        setChatSettings({
          model: modelId,
        });

        // Reset all chat-specific states
        setSelectedChat(null);
        setChatMessages([]);
        setUserInput('');
        setChatFiles([]);
        setChatImages([]);
        setNewMessageFiles([]);
        setNewMessageImages([]);
        setIsGenerating(false);
        setFirstTokenReceived(false);

        // Fetch workspace data
        const success = await fetchWorkspaceData(
          user.id,
          setChats,
          setChatsCursor,
          setChatsIsDone,
        );
        if (!success) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Workspace initialization error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    // Initialize immediately if no user (will redirect to login)
    // Or wait for subscription data to be loaded if user exists
    if (!user || (user && subscriptionLoaded)) {
      initializeWorkspace();
    }
  }, [user, subscriptionStatus, subscriptionLoaded, router]);

  if (loading) {
    return <Loading />;
  }

  return <Dashboard>{children}</Dashboard>;
}
