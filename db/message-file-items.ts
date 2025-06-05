import { ConvexClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not defined');
}

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const getMessageFileItemsByMessageId = async (messageId: string) => {
  try {
    const fileItems = await convex.query(
      api.file_items.getFileItemsByMessageId,
      {
        messageId,
      },
    );
    return fileItems;
  } catch (error) {
    console.error('Error fetching message file items:', error);
    // Return empty array on error to maintain consistent behavior
    return [];
  }
};
