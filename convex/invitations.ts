import { query, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get team invitation by email and team ID
 */
export const getTeamInvitation = query({
  args: {
    serviceKey: v.string(),
    inviteeEmail: v.string(),
    teamId: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.string(),
      team_id: v.string(),
      inviter_id: v.string(),
      invitee_email: v.string(),
      status: v.union(
        v.literal('pending'),
        v.literal('accepted'),
        v.literal('rejected'),
      ),
      updated_at: v.optional(v.number()),
      team_name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    // Get the team invitation
    const invitation = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_and_email', (q) =>
        q.eq('team_id', args.teamId).eq('invitee_email', args.inviteeEmail),
      )
      .first();

    if (!invitation) {
      return null;
    }

    // Get the team details
    const team = await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('id'), invitation.team_id))
      .first();

    if (!team) {
      return null;
    }

    return {
      id: invitation.id,
      team_id: invitation.team_id,
      inviter_id: invitation.inviter_id,
      invitee_email: invitation.invitee_email,
      status: invitation.status,
      updated_at: invitation.updated_at,
      team_name: team.name,
    };
  },
});

/**
 * Invite user to team
 */
export const inviteUserToTeam = internalMutation({
  args: {
    teamId: v.string(),
    inviteeEmail: v.string(),
    inviterId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if current user is admin/owner of the team
    const inviterMember = await ctx.db
      .query('team_members')
      .withIndex('by_team_and_user', (q) =>
        q.eq('team_id', args.teamId).eq('user_id', args.inviterId),
      )
      .first();

    if (!inviterMember || !['owner'].includes(inviterMember.role)) {
      throw new Error('Only team owners can invite members to the team');
    }

    const existingInvitationCheck = await ctx.db
      .query('team_invitations')
      .withIndex('by_invitee_email', (q) =>
        q.eq('invitee_email', args.inviteeEmail),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'accepted'),
        ),
      )
      .first();

    if (existingInvitationCheck) {
      throw new Error(
        'User already has a team, subscription, or pending invitation',
      );
    }

    // Check if user is already a team member or has a pending invitation for this specific team
    const existingInvitation = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_and_email', (q) =>
        q.eq('team_id', args.teamId).eq('invitee_email', args.inviteeEmail),
      )
      .first();

    if (existingInvitation && existingInvitation.status === 'pending') {
      throw new Error('User already has a pending invitation');
    }

    // Create the invitation
    await ctx.db.insert('team_invitations', {
      id: uuidv4(),
      team_id: args.teamId,
      inviter_id: args.inviterId,
      invitee_email: args.inviteeEmail,
      status: 'pending',
      updated_at: Date.now(),
    });

    return true;
  },
});

/**
 * Accept team invitation
 */
export const acceptTeamInvitation = internalMutation({
  args: {
    invitationId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the invitation
    const invitation = await ctx.db
      .query('team_invitations')
      .filter((q) => q.eq(q.field('id'), args.invitationId))
      .first();

    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid or expired invitation');
    }

    // Check if the user's email matches the invitation
    if (invitation.invitee_email !== args.userEmail) {
      throw new Error('This invitation is not for your email address');
    }

    // Add the user to the team
    await ctx.db.insert('team_members', {
      id: uuidv4(),
      team_id: invitation.team_id,
      user_id: args.userId,
      invitation_id: invitation.id,
      role: 'member',
    });

    // Update the invitation status
    await ctx.db.patch(invitation._id, {
      status: 'accepted',
      updated_at: Date.now(),
    });

    return true;
  },
});

/**
 * Reject team invitation
 */
export const rejectTeamInvitation = internalMutation({
  args: {
    invitationId: v.string(),
    userEmail: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the invitation
    const invitation = await ctx.db
      .query('team_invitations')
      .filter((q) => q.eq(q.field('id'), args.invitationId))
      .first();

    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid or expired invitation');
    }

    // Check if the user's email matches the invitation
    if (invitation.invitee_email !== args.userEmail) {
      throw new Error('This invitation is not for your email address');
    }

    // Update the invitation status
    await ctx.db.patch(invitation._id, {
      status: 'rejected',
      updated_at: Date.now(),
    });

    return true;
  },
});

/**
 * Get team ID by user ID or email (checking invitations)
 */
export const getTeamIdByInvitation = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query('team_invitations')
      .withIndex('by_invitee_email', (q) => q.eq('invitee_email', args.email))
      .first();

    if (invitation) {
      return invitation.team_id;
    }

    return null;
  },
});
