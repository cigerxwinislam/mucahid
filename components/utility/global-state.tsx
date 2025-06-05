'use client';

import { PentestGPTContext } from '@/context/context';
import { getChatFilesByChatId } from '@/db/chat-files';
import { getChatById } from '@/db/chats';
import { getMessagesByChatId } from '@/db/messages';
import { getProfileByUserId } from '@/db/profiles';
import { processMessageImages } from '@/db/storage/message-images';
import {
  getSubscriptionByTeamId,
  getSubscriptionByUserId,
} from '@/db/subscriptions';
import { getTeamMembersByTeamId } from '@/db/teams';
import type { ProcessedTeamMember } from '@/lib/team-utils';
import type {
  ChatMessage,
  ChatSettings,
  ContentType,
  LLMID,
  MessageImage,
  SubscriptionStatus,
} from '@/types';
import type { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AgentSidebarProvider } from '@/components/chat/chat-hooks/use-agent-sidebar';
import type { Doc } from '@/convex/_generated/dataModel';
import { supabase } from '@/lib/supabase/browser-client';

const MESSAGES_PER_FETCH = 20;

interface GlobalStateProps {
  user: User | null;
  children: React.ReactNode;
}

export const GlobalState: FC<GlobalStateProps> = ({ children, user }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PROFILE STORE
  const [profile, setProfile] = useState<Doc<'profiles'> | null>(null);

  // CONTENT TYPE STORE
  const [contentType, setContentType] = useState<ContentType>('chats');

  // SUBSCRIPTION STORE
  const [subscription, setSubscription] = useState<Doc<'subscriptions'> | null>(
    null,
  );
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>('free');
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [teamMembers, setTeamMembers] = useState<ProcessedTeamMember[] | null>(
    null,
  );
  const [membershipData, setMembershipData] =
    useState<ProcessedTeamMember | null>(null);
  // ITEMS STORE
  const [chats, setChats] = useState<Doc<'chats'>[]>([]);
  const [chatsCursor, setChatsCursor] = useState<string | null>(null);
  const [chatsIsDone, setChatsIsDone] = useState<boolean>(false);

  // PASSIVE CHAT STORE
  const [userInput, setUserInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [temporaryChatMessages, setTemporaryChatMessages] = useState<
    ChatMessage[]
  >([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    model: 'mistral-medium',
  });
  const [selectedChat, setSelectedChat] = useState<Doc<'chats'> | null>(null);

  // ACTIVE CHAT STORE
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // ATTACHMENTS STORE
  const [chatFiles, setChatFiles] = useState<Doc<'files'>[]>([]);
  const [chatImages, setChatImages] = useState<MessageImage[]>([]);
  const [newMessageFiles, setNewMessageFiles] = useState<Doc<'files'>[]>([]);
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([]);

  // RETIEVAL STORE
  const [sourceCount, setSourceCount] = useState<number>(4);

  // Audio
  const [isMicSupported, setIsMicSupported] = useState(true);

  // TEMPORARY CHAT STORE
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);

  // Loading Messages States
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);

  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setIsTemporaryChat(searchParams.get('temporary-chat') === 'true');
  }, [searchParams]);

  useEffect(() => {
    fetchStartingData();
  }, []);

  // Auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear session storage only
        Object.entries(window.sessionStorage).forEach(([key]) => {
          window.sessionStorage.removeItem(key);
        });
        router.push('/login');
      } else if (!session) {
        router.push('/login');
      }
    });

    // Clean up subscription on component unmount
    return () => subscription.unsubscribe();
  }, [router]);

  const updateSubscription = useCallback(
    (newSubscription: Doc<'subscriptions'> | null) => {
      setSubscription(newSubscription);
      if (newSubscription) {
        setSubscriptionStatus(newSubscription.plan_type as SubscriptionStatus);
      } else {
        setSubscriptionStatus('free');
      }
    },
    [],
  );

  const isPremiumSubscription = useMemo(
    () => subscriptionStatus !== 'free',
    [subscriptionStatus],
  );

  const fetchStartingData = async () => {
    if (user) {
      setUserEmail(user.email || 'Not available');

      const profile = await getProfileByUserId();

      // Set profile even if null to stop loading state
      setProfile(profile);

      if (!profile) {
        // User doesn't have a profile yet, show error and set subscription as loaded
        toast.error('Profile not found. Please contact support.');
        setSubscriptionLoaded(true);
        return;
      }

      const [subscription, members] = await Promise.all([
        getSubscriptionByUserId(user.id),
        getTeamMembersByTeamId(),
      ]);

      updateSubscription(subscription);

      const membershipData = members?.find(
        (member) =>
          member.member_user_id === user.id ||
          member.invitee_email === user.email,
      );

      // Only consider the user as having team access if their invitation is accepted
      // Still show all team data for UI purposes (including pending invitations)
      if (membershipData?.invitation_status === 'accepted') {
        setTeamMembers(members);
        setMembershipData(membershipData);

        // Only get team subscription if user has accepted invitation
        if (
          (!subscription || subscription.status !== 'active') &&
          members &&
          members.length > 0
        ) {
          const teamSubscription = await getSubscriptionByTeamId(
            members[0].team_id,
          );
          updateSubscription(teamSubscription);
        }
      } else if (membershipData?.invitation_status === 'pending') {
        // Show team data for pending invitations but don't grant team subscription access
        setTeamMembers(members);
        setMembershipData(membershipData);
        // Don't update subscription - keep user's individual subscription status
      } else {
        // No valid team membership (rejected or no invitation)
        setTeamMembers(null);
        setMembershipData(null);
      }

      // Mark subscription as loaded after all subscription logic is complete
      setSubscriptionLoaded(true);
    }
  };

  const refreshTeamMembers = async () => {
    await fetchStartingData();
  };

  const fetchMessagesAndProcess = async (
    chatId: string,
    oldestSequenceNumber?: number,
  ) => {
    if (isTemporaryChat) {
      return temporaryChatMessages;
    }

    const fetchedMessages = await getMessagesByChatId(
      chatId,
      MESSAGES_PER_FETCH,
      oldestSequenceNumber,
    );

    const images = await processMessageImages(fetchedMessages);
    setChatImages((prevImages) => [...prevImages, ...images]);

    return fetchedMessages.map((fetchMessage) => ({
      message: fetchMessage,
      fileItems: fetchMessage.file_items || [],
      feedback: fetchMessage.feedback?.[0] || undefined,
    }));
  };

  const handleChatNotFound = (chatId: string) => {
    const toastKey = `chat-not-found-${chatId}`;
    if (!window.sessionStorage.getItem(toastKey)) {
      toast.error(`Unable to load conversation ${chatId}`);
      window.sessionStorage.setItem(toastKey, 'true');
      setTimeout(() => window.sessionStorage.removeItem(toastKey), 2000);
    }

    router.push(`/c`);
  };

  const fetchMessages = async (chatId: string) => {
    if (isTemporaryChat) {
      return;
    }

    const reformatedMessages = await fetchMessagesAndProcess(chatId);

    const chatFiles = await getChatFilesByChatId(chatId);

    if (!chatFiles) {
      // Chat not found, redirect to the chat page
      handleChatNotFound(chatId);
      return;
    }

    setChatFiles(chatFiles);

    setAllMessagesLoaded(false);
    setIsLoadingMore(false);

    setChatMessages(reformatedMessages);
  };

  const loadMoreMessages = async (chatId: string) => {
    if (
      isTemporaryChat ||
      allMessagesLoaded ||
      isLoadingMore ||
      !chatMessages.length
    )
      return;

    const oldestSequenceNumber = chatMessages[0].message.sequence_number;

    if (!chatId) {
      console.error('Chat ID is undefined');
      return;
    }

    setIsLoadingMore(true);

    try {
      const olderMessages = await fetchMessagesAndProcess(
        chatId,
        oldestSequenceNumber,
      );

      if (olderMessages.length > 0) {
        setChatMessages((prevMessages) => [...olderMessages, ...prevMessages]);
      }

      setAllMessagesLoaded(
        olderMessages.length < MESSAGES_PER_FETCH ||
          olderMessages[0].message.sequence_number <= 1,
      );
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 200);
    }
  };

  const fetchChat = async (chatId: string) => {
    if (isTemporaryChat) {
      return;
    }

    try {
      // First, try to find the chat in the existing chats array
      const existingChat = chats.find((chat) => chat.id === chatId);

      if (existingChat) {
        // Chat found in existing data, use it directly
        setSelectedChat(existingChat);
        setChatSettings({
          model: existingChat.model as LLMID,
        });
        return;
      }

      // Only make API call if chat is not found in existing data
      const chat = await getChatById(chatId);
      if (!chat) {
        // Chat not found, redirect to the chat page
        router.push(`/c`);
        return;
      }

      setSelectedChat(chat);
      setChatSettings({
        model: chat.model as LLMID,
      });
    } catch (error) {
      console.error('Error fetching chat:', error);
      // Handle the error, e.g., show an error message to the user
      // and redirect to the chat page
      handleChatNotFound(chatId);
    }
  };

  return (
    <PentestGPTContext.Provider
      value={{
        // USER STORE
        user,

        // PROFILE STORE
        profile,
        setProfile,
        fetchStartingData,

        // CONTENT TYPE STORE
        contentType,
        setContentType,

        // SUBSCRIPTION STORE
        subscription,
        setSubscription,
        subscriptionStatus,
        setSubscriptionStatus,
        subscriptionLoaded,
        updateSubscription,
        isPremiumSubscription,
        teamMembers,
        refreshTeamMembers,
        membershipData,

        // ITEMS STORE
        chats,
        setChats,
        chatsCursor,
        setChatsCursor,
        chatsIsDone,
        setChatsIsDone,

        // PASSIVE CHAT STORE
        userInput,
        setUserInput,
        chatMessages,
        setChatMessages,
        temporaryChatMessages,
        setTemporaryChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,

        // ACTIVE CHAT STORE
        abortController,
        setAbortController,

        // ATTACHMENT STORE
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,

        // RETRIEVAL STORE
        sourceCount,
        setSourceCount,

        // Audio
        isMicSupported,
        setIsMicSupported,

        // TEMPORARY CHAT STORE
        isTemporaryChat,

        // Fetch Chat and Messages
        fetchChat,
        fetchMessages,
        loadMoreMessages,

        // Loading Messages States
        isLoadingMore,
        allMessagesLoaded,

        // User Email
        userEmail,
        setUserEmail,
      }}
    >
      <AgentSidebarProvider>{children}</AgentSidebarProvider>
    </PentestGPTContext.Provider>
  );
};
