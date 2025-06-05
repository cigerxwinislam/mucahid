import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createResponse,
  createErrorResponse,
  validateAuthWithUser,
} from './httpUtils';

// Main HTTP action handler for all subscription operations
export const handleSubscriptionsHttp = httpAction(async (ctx, request) => {
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
    const { type, teamId } = body;

    // Route based on operation type
    switch (type) {
      case 'getSubscriptionByUserId': {
        const targetUserId = user.id;

        const result = await ctx.runQuery(
          internal.subscriptions.getSubscriptionByUserId,
          {
            userId: targetUserId,
          },
        );
        return createResponse({ data: result }, 200);
      }

      case 'getSubscriptionByTeamId': {
        if (!teamId) {
          return createErrorResponse('Missing teamId parameter', 400);
        }

        const result = await ctx.runQuery(
          internal.subscriptions.getSubscriptionByTeamId,
          {
            teamId,
          },
        );
        return createResponse({ data: result }, 200);
      }

      default:
        return createErrorResponse('Invalid operation type', 400);
    }
  } catch (error) {
    console.error('Error handling subscription request:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
