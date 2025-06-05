import { ConvexClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not defined');
}

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const getChatFilesByChatId = async (chatId: string) => {
  try {
    const chatFiles = await convex.query(api.files.getFiles, {
      chatId: chatId,
    });

    return chatFiles || [];
  } catch (error) {
    console.error('[getChatFilesByChatId] Error fetching chat files:', error);
    throw error;
  }
};
