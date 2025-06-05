import { makeAuthenticatedRequest } from '@/lib/api/convex';
import type { Doc } from '@/convex/_generated/dataModel';

export type Chat = Doc<'chats'>;

export const getChatById = async (chatId: string): Promise<Chat> => {
  try {
    const data = await makeAuthenticatedRequest('/api/chats', 'POST', {
      type: 'get',
      chatId,
    });

    if (!data?.chat) {
      throw new Error('Chat not found');
    }

    return data.chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

export const getChatsByUserId = async (
  userId: string,
  numItems = 25,
  cursor: string | null = null,
): Promise<{
  chats: Chat[];
  isDone: boolean;
  continueCursor: string | null;
}> => {
  try {
    const data = await makeAuthenticatedRequest('/api/chats', 'POST', {
      type: 'get',
      userId,
      paginationOpts: {
        numItems,
        cursor,
      },
    });

    return {
      chats: data?.chats ?? [],
      isDone: data?.isDone ?? true,
      continueCursor: data?.continueCursor ?? null,
    };
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const updateChat = async (
  chatId: string,
  updates: Partial<Omit<Chat, '_id' | '_creationTime' | 'id' | 'user_id'>>,
): Promise<Chat> => {
  try {
    const data = await makeAuthenticatedRequest('/api/chats', 'POST', {
      type: 'update',
      chatId,
      updates,
    });

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to update chat');
    }

    // Fetch the updated chat to return it
    return await getChatById(chatId);
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
};

export const deleteChat = async (chatId: string): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/chats', 'POST', {
      type: 'delete',
      chatId,
    });

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to delete chat');
    }

    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

export const deleteAllChats = async (userId: string): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/chats', 'POST', {
      type: 'deleteAll',
      userId,
    });

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to delete all chats');
    }

    return true;
  } catch (error) {
    console.error('Error deleting all chats:', error);
    throw error;
  }
};

// export const getLastSharedMessageId = async (chatId: string) => {
//   const messageId = await convex.query(api.chats.getLastSharedMessageId, {
//     chatId,
//   });

//   return messageId;
// };

// export const getSharedChatsByUserId = async (userId: string) => {
//   const chats = await convex.query(api.chats.getSharedChatsByUserId, {
//     userId,
//   });

//   return chats;
// };
