import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createResponse,
  createErrorResponse,
  validateAuthWithUser,
} from './httpUtils';

// Main HTTP action handler for all team operations
export const handleTeamsHttp = httpAction(async (ctx, request) => {
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
    const { type, teamId, memberEmail, inviteeEmail, invitationId } = body;

    // Route based on operation type
    switch (type) {
      case 'getTeamMembersByUserId': {
        // Use authenticated user's ID instead of requiring it from client
        const teamId = await ctx.runQuery(
          internal.teams.getTeamIdByUserOrEmail,
          {
            userId,
            userEmail,
          },
        );

        if (!teamId) {
          return createResponse({ data: [] }, 200);
        }

        const result = await ctx.runQuery(internal.teams.getTeamMembers, {
          teamId,
        });
        return createResponse({ data: result }, 200);
      }

      case 'removeUserFromTeam': {
        if (!teamId || !memberEmail) {
          return createErrorResponse(
            'Missing teamId or memberEmail parameter',
            400,
          );
        }

        const result = await ctx.runMutation(
          internal.teams.removeUserFromTeam,
          {
            teamId,
            memberEmail,
            currentUserId: user.id,
          },
        );
        return createResponse({ data: result }, 200);
      }

      case 'inviteUserToTeam': {
        if (!teamId || !inviteeEmail) {
          return createErrorResponse(
            'Missing teamId or inviteeEmail parameter',
            400,
          );
        }

        const result = await ctx.runMutation(
          internal.invitations.inviteUserToTeam,
          {
            teamId,
            inviteeEmail,
            inviterId: user.id,
          },
        );
        return createResponse({ data: result }, 200);
      }

      case 'acceptTeamInvitation': {
        if (!invitationId || !userEmail) {
          return createErrorResponse(
            'Missing invitationId or userEmail parameter',
            400,
          );
        }

        const result = await ctx.runMutation(
          internal.invitations.acceptTeamInvitation,
          {
            invitationId,
            userId,
            userEmail,
          },
        );
        return createResponse({ data: result }, 200);
      }

      case 'rejectTeamInvitation': {
        if (!invitationId || !userEmail) {
          return createErrorResponse(
            'Missing invitationId or userEmail parameter',
            400,
          );
        }

        const result = await ctx.runMutation(
          internal.invitations.rejectTeamInvitation,
          {
            invitationId,
            userEmail,
          },
        );
        return createResponse({ data: result }, 200);
      }

      default:
        return createErrorResponse('Invalid operation type', 400);
    }
  } catch (error) {
    console.error('Error handling team request:', error);
    if (error instanceof Error) {
      if (error.message === 'Unauthorized: User ID mismatch') {
        return createErrorResponse('Unauthorized: User ID mismatch', 403);
      }
      if (error.message.includes('Only team admins')) {
        return createErrorResponse(error.message, 403);
      }
      if (error.message.includes('already has a team')) {
        return createErrorResponse(error.message, 409);
      }
    }
    return createErrorResponse('Internal server error', 500);
  }
});
