import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createResponse,
  createErrorResponse,
  validateAuthWithUser,
} from './httpUtils';

// Helper function to validate user ID
const validateUserId = (
  providedUserId: string,
  authenticatedUserId: string,
) => {
  if (providedUserId !== authenticatedUserId) {
    throw new Error('Unauthorized: User ID mismatch');
  }
};

// Main HTTP action handler for all chat operations
export const handleChatsHttp = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate authentication with user verification
    const authResult = await validateAuthWithUser(request);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(
        authResult.error || 'Authentication failed',
        401,
      );
    }

    const { user } = authResult;

    // Parse request body
    const body = await request.json();
    const { type, chatId, userId, updates, paginationOpts } = body;

    // Route based on operation type
    switch (type) {
      case 'get': {
        if (chatId) {
          // Get single chat
          const chat = await ctx.runQuery(internal.chats.getChatById, {
            chatId,
          });
          // Validate user ID if chat exists
          if (chat && chat.user_id !== user.id) {
            return createErrorResponse('Unauthorized', 401);
          }
          return createResponse({ chat }, 200);
        } else if (userId) {
          // Validate user ID for get chats by user ID
          validateUserId(userId, user.id);
          // Get chats by user ID
          const result = await ctx.runQuery(internal.chats.getChatsByUserId, {
            userId,
            paginationOpts: {
              numItems: paginationOpts?.numItems ?? 25,
              cursor: paginationOpts?.cursor ?? null,
            },
          });
          return createResponse(result, 200);
        }
        return createErrorResponse('Missing required parameters', 400);
      }

      case 'update': {
        if (!chatId) {
          return createErrorResponse('Missing chat_id parameter', 400);
        }
        if (!updates) {
          return createErrorResponse('Missing updates data', 400);
        }
        // Get chat to validate ownership
        const existingChat = await ctx.runQuery(internal.chats.getChatById, {
          chatId,
        });
        if (!existingChat) {
          return createErrorResponse('Chat not found', 404);
        }
        // Validate user ID for chat update
        validateUserId(existingChat.user_id, user.id);
        const result = await ctx.runMutation(
          internal.chats.InternalUpdateChat,
          {
            chatId,
            updates,
          },
        );
        return createResponse(result, result.success ? 200 : 400);
      }

      case 'delete': {
        if (!chatId) {
          return createErrorResponse('Missing chat_id parameter', 400);
        }
        // Get chat to validate ownership
        const existingChat = await ctx.runQuery(internal.chats.getChatById, {
          chatId,
        });
        if (!existingChat) {
          return createErrorResponse('Chat not found', 404);
        }
        // Validate user ID for chat deletion
        validateUserId(existingChat.user_id, user.id);
        const result = await ctx.runMutation(internal.chats.deleteChat, {
          chatId,
        });
        return createResponse(result, result.success ? 200 : 400);
      }

      case 'deleteAll': {
        if (!userId) {
          return createErrorResponse('Missing user_id parameter', 400);
        }
        // Validate user ID for delete all chats
        validateUserId(userId, user.id);
        const result = await ctx.runMutation(internal.chats.deleteAllChats, {
          userId,
        });
        return createResponse(result, result.success ? 200 : 400);
      }

      default:
        return createErrorResponse('Invalid operation type', 400);
    }
  } catch (error) {
    console.error('Error handling chat request:', error);
    if (error instanceof Error) {
      if (error.message === 'Unauthorized: User ID mismatch') {
        return createErrorResponse('Unauthorized: User ID mismatch', 403);
      }
    }
    return createErrorResponse('Internal server error', 500);
  }
});
