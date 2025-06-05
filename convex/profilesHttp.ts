import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createResponse,
  createErrorResponse,
  validateAuthWithUser,
} from './httpUtils';

// Main HTTP action handler for all profile operations
export const handleProfilesHttp = httpAction(async (ctx, request) => {
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
    const userEmail = user.email;
    const userId = user.id;

    // Parse request body
    const body = await request.json();
    const { type, profile_context } = body;

    // Route based on operation type
    switch (type) {
      case 'getProfileByUserId': {
        const result = await ctx.runMutation(
          internal.profiles.getOrCreateProfile,
          {
            userId,
          },
        );

        return createResponse({ data: result }, 200);
      }

      case 'updateProfile': {
        const result = await ctx.runMutation(internal.profiles.updateProfile, {
          userId,
          profile_context,
        });
        return createResponse({ data: result }, 200);
      }

      case 'deleteProfile': {
        const result = await ctx.runMutation(
          internal.profileDeletion.deleteProfile,
          {
            userId,
            userEmail,
          },
        );
        return createResponse({ data: result }, 200);
      }

      default:
        return createErrorResponse('Invalid operation type', 400);
    }
  } catch (error) {
    console.error('Error handling profile request:', error);
    if (error instanceof Error) {
      if (error.message === 'Profile already exists for this user') {
        return createErrorResponse(error.message, 409);
      }
      if (error.message === 'Profile not found') {
        return createErrorResponse(error.message, 404);
      }
    }
    return createErrorResponse('Internal server error', 500);
  }
});
