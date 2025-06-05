import type { Doc } from '@/convex/_generated/dataModel';
import type { ProcessedTeamMember } from '@/lib/team-utils';
import type {
  ChatMessage,
  ChatSettings,
  ContentType,
  MessageImage,
  SubscriptionStatus,
} from '@/types';
import type { User } from '@supabase/supabase-js';
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
} from 'react';

interface PentestGPTContextType {
  // USER STORE
  user: User | null;

  // PROFILE STORE
  profile: Doc<'profiles'> | null;
  setProfile: Dispatch<SetStateAction<Doc<'profiles'> | null>>;
  fetchStartingData: () => Promise<void>;
  // CONTENT TYPE STORE
  contentType: ContentType;
  setContentType: React.Dispatch<React.SetStateAction<ContentType>>;

  // SUBSCRIPTION STORE
  subscription: Doc<'subscriptions'> | null;
  setSubscription: Dispatch<SetStateAction<Doc<'subscriptions'> | null>>;
  subscriptionStatus: SubscriptionStatus;
  setSubscriptionStatus: Dispatch<SetStateAction<SubscriptionStatus>>;
  subscriptionLoaded: boolean;
  updateSubscription: (newSubscription: Doc<'subscriptions'> | null) => void;
  isPremiumSubscription: boolean;
  teamMembers: ProcessedTeamMember[] | null;
  refreshTeamMembers: () => Promise<void>;
  membershipData: ProcessedTeamMember | null;

  // ITEMS STORE
  chats: Doc<'chats'>[];
  setChats: Dispatch<SetStateAction<Doc<'chats'>[]>>;
  chatsCursor: string | null;
  setChatsCursor: Dispatch<SetStateAction<string | null>>;
  chatsIsDone: boolean;
  setChatsIsDone: Dispatch<SetStateAction<boolean>>;

  // PASSIVE CHAT STORE
  userInput: string;
  setUserInput: Dispatch<SetStateAction<string>>;
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  chatSettings: ChatSettings | null;
  setChatSettings: Dispatch<SetStateAction<ChatSettings>>;
  selectedChat: Doc<'chats'> | null;
  setSelectedChat: Dispatch<SetStateAction<Doc<'chats'> | null>>;
  temporaryChatMessages: ChatMessage[];
  setTemporaryChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;

  // ACTIVE CHAT STORE
  abortController: AbortController | null;
  setAbortController: Dispatch<SetStateAction<AbortController | null>>;

  // ATTACHMENTS STORE
  chatFiles: Doc<'files'>[];
  setChatFiles: Dispatch<SetStateAction<Doc<'files'>[]>>;
  chatImages: MessageImage[];
  setChatImages: Dispatch<SetStateAction<MessageImage[]>>;
  newMessageFiles: Doc<'files'>[];
  setNewMessageFiles: Dispatch<SetStateAction<Doc<'files'>[]>>;
  newMessageImages: MessageImage[];
  setNewMessageImages: Dispatch<SetStateAction<MessageImage[]>>;

  // RETRIEVAL STORE
  sourceCount: number;
  setSourceCount: Dispatch<SetStateAction<number>>;

  // Audio
  isMicSupported: boolean;
  setIsMicSupported: Dispatch<SetStateAction<boolean>>;

  // TEMPORARY CHAT STORE
  isTemporaryChat: boolean;

  // Fetch Chat and Messages
  fetchChat: (chatId: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;

  // Loading Messages States
  isLoadingMore: boolean;
  allMessagesLoaded: boolean;

  // User Email
  userEmail: string;
  setUserEmail: (email: string) => void;
}

export const PentestGPTContext = createContext<PentestGPTContextType>({
  // USER STORE
  user: null,

  // PROFILE STORE
  profile: null,
  setProfile: () => {},
  fetchStartingData: async () => {},
  // CONTENT TYPE STORE
  contentType: 'chats',
  setContentType: () => {},

  // SUBSCRIPTION STORE
  subscription: null,
  setSubscription: () => {},
  subscriptionStatus: 'free',
  setSubscriptionStatus: () => {},
  subscriptionLoaded: false,
  updateSubscription: () => {},
  isPremiumSubscription: false,
  teamMembers: null,
  refreshTeamMembers: async () => {},
  membershipData: null,

  // ITEMS STORE
  chats: [],
  setChats: () => {},
  chatsCursor: null,
  setChatsCursor: () => {},
  chatsIsDone: false,
  setChatsIsDone: () => {},

  // PASSIVE CHAT STORE
  userInput: '',
  setUserInput: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  chatMessages: [],
  setChatMessages: () => {},
  chatSettings: null,
  setChatSettings: () => {},
  temporaryChatMessages: [],
  setTemporaryChatMessages: () => {},

  // ACTIVE CHAT STORE
  abortController: null,
  setAbortController: () => {},

  // ATTACHMENTS STORE
  chatFiles: [],
  setChatFiles: () => {},
  chatImages: [],
  setChatImages: () => {},
  newMessageFiles: [],
  setNewMessageFiles: () => {},
  newMessageImages: [],
  setNewMessageImages: () => {},

  // RETRIEVAL STORE
  sourceCount: 4,
  setSourceCount: () => {},

  // Audio
  isMicSupported: false,
  setIsMicSupported: () => {},

  // TEMPORARY CHAT STORE
  isTemporaryChat: false,

  // Loading Messages States
  isLoadingMore: false,
  allMessagesLoaded: false,

  // Fetch Chat and Messages
  fetchChat: async (chatId: string) => {},
  fetchMessages: async (chatId: string) => {},
  loadMoreMessages: async (chatId: string) => {},

  // User Email
  userEmail: '',
  setUserEmail: () => {},
});

export const usePentestGPT = () => useContext(PentestGPTContext);
