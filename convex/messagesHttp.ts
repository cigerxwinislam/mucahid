import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Helper function to create response with consistent headers
const createResponse = (
  data: unknown,
  status: number,
  origin: string | null,
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      Vary: 'Origin',
    },
  });
};

export const getMessagesWithFilesHttp = httpAction(async (ctx, request) => {
  const origin = request.headers.get('Origin');
  const authHeader = request.headers.get('Authorization');

  // Validate auth header
  if (!authHeader?.startsWith('Bearer ')) {
    return createResponse({ error: 'Unauthorized' }, 401, origin);
  }

  try {
    // Get parameters from URL
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chat_id');
    const limit = url.searchParams.get('limit');
    const lastSequenceNumber = url.searchParams.get('last_sequence_number');

    if (!chatId) {
      return createResponse(
        { error: 'Missing chat_id parameter' },
        400,
        origin,
      );
    }

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      return createResponse({ error: 'Invalid token' }, 401, origin);
    }

    // Get messages with files
    const messages = await ctx.runQuery(
      internal.messages.internalGetMessagesWithFiles,
      {
        chatId,
        limit: limit ? Number.parseInt(limit) : undefined,
        lastSequenceNumber: lastSequenceNumber
          ? Number.parseInt(lastSequenceNumber)
          : undefined,
      },
    );

    return createResponse({ messages }, 200, origin);
  } catch (error) {
    console.error('Error getting messages:', error);
    return createResponse({ error: 'Internal server error' }, 500, origin);
  }
});
