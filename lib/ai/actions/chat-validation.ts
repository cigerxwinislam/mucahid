import { ChatSDKError } from '@/lib/errors';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import type { ChatMetadata } from '@/types';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL environment variable is not defined. Please check your environment configuration.',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function validateChatAccess({
  chatMetadata,
  userId,
}: {
  chatMetadata: ChatMetadata;
  userId: string;
}) {
  if (!chatMetadata.id) {
    return null;
  }

  try {
    const chat = await convex.query(api.chats.getChatByIdWithValidation, {
      chatId: chatMetadata.id,
      userId,
    });

    return chat;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new ChatSDKError('forbidden:chat');
    }
    console.error('Error validating chat access:', error);
    throw new ChatSDKError('bad_request:database');
  }
}
