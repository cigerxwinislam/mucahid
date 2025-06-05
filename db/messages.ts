import { makeAuthenticatedRequest } from '@/lib/api/convex';
import type { Doc } from '@/convex/_generated/dataModel';

type MessageWithExtras = Doc<'messages'> & {
  image_paths?: string[];
  file_items?: Doc<'file_items'>[];
  feedback?: Doc<'feedback'>[];
};

export const getMessagesByChatId = async (
  chatId: string,
  limit = 20,
  lastSequenceNumber?: number,
): Promise<MessageWithExtras[]> => {
  try {
    // Build URL with query parameters
    const url = new URL(
      '/messages',
      process.env.NEXT_PUBLIC_CONVEX_HTTP_ACTIONS_URL,
    );
    url.searchParams.append('chat_id', chatId);
    if (limit) url.searchParams.append('limit', limit.toString());
    if (lastSequenceNumber)
      url.searchParams.append(
        'last_sequence_number',
        lastSequenceNumber.toString(),
      );

    const data = await makeAuthenticatedRequest(
      url.pathname + url.search,
      'GET',
    );
    if (!data) return [];

    return (data.messages || []) as MessageWithExtras[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};
