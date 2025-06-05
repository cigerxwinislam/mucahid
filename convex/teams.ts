import { query, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get team information for a user (equivalent to the inviterTeam query)
 */
export const getUserTeam = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.string(),
      team_id: v.string(),
      user_id: v.string(),
      invitation_id: v.optional(v.string()),
      role: v.union(v.literal('member'), v.literal('owner')),
      team_name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get the team member record for the user
    const teamMember = await ctx.db
      .query('team_members')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .first();

    if (!teamMember) {
      return null;
    }

    // Get the team details
    const team = await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('id'), teamMember.team_id))
      .first();

    if (!team) {
      return null;
    }

    return {
      id: teamMember.id,
      team_id: teamMember.team_id,
      user_id: teamMember.user_id,
      invitation_id: teamMember.invitation_id,
      role: teamMember.role,
      team_name: team.name,
    };
  },
});

/**
 * Get team members by team ID (equivalent to get_team_members RPC)
 */
export const getTeamMembers = internalQuery({
  args: {
    teamId: v.string(),
  },
  returns: v.array(
    v.object({
      team_id: v.string(),
      team_name: v.string(),
      member_id: v.optional(v.string()),
      member_user_id: v.optional(v.string()),
      member_role: v.optional(v.union(v.literal('member'), v.literal('owner'))),
      invitation_id: v.string(),
      invitee_email: v.string(),
      invitation_status: v.union(
        v.literal('pending'),
        v.literal('accepted'),
        v.literal('rejected'),
      ),
      invitation_created_at: v.number(),
      invitation_updated_at: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the team
    const team = await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('id'), args.teamId))
      .first();

    if (!team) {
      return [];
    }

    // Get all invitations for this team
    const invitations = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_id', (q) => q.eq('team_id', args.teamId))
      .collect();

    const result = [];

    for (const invitation of invitations) {
      // Get team member if invitation is accepted
      const teamMember = await ctx.db
        .query('team_members')
        .withIndex('by_invitation_id', (q) =>
          q.eq('invitation_id', invitation.id),
        )
        .first();

      result.push({
        team_id: team.id,
        team_name: team.name,
        member_id: teamMember?.id,
        member_user_id: teamMember?.user_id,
        member_role: teamMember?.role,
        invitation_id: invitation.id,
        invitee_email: invitation.invitee_email,
        invitation_status: invitation.status,
        invitation_created_at: invitation._creationTime,
        invitation_updated_at: invitation.updated_at,
      });
    }

    return result;
  },
});

/**
 * Get team ID by user ID or email
 */
export const getTeamIdByUserOrEmail = internalQuery({
  args: {
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // First try to get team ID from user's team membership
    if (args.userId) {
      const teamMember = await ctx.db
        .query('team_members')
        .withIndex('by_user_id', (q) => q.eq('user_id', args.userId!))
        .first();

      if (teamMember) {
        return teamMember.team_id;
      }
    }

    // If no team membership found and email provided, check invitations
    if (args.userEmail) {
      const invitation = await ctx.db
        .query('team_invitations')
        .withIndex('by_invitee_email', (q) =>
          q.eq('invitee_email', args.userEmail!),
        )
        .first();

      if (invitation) {
        return invitation.team_id;
      }
    }

    return null;
  },
});

/**
 * Remove user from team (equivalent to remove_user_from_team RPC)
 */
export const removeUserFromTeam = internalMutation({
  args: {
    teamId: v.string(),
    memberEmail: v.string(),
    currentUserId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if current user is admin/owner of the team
    const currentUserMember = await ctx.db
      .query('team_members')
      .withIndex('by_team_and_user', (q) =>
        q.eq('team_id', args.teamId).eq('user_id', args.currentUserId),
      )
      .first();

    if (!currentUserMember || !['owner'].includes(currentUserMember.role)) {
      throw new Error('Only team admins can remove members from the team');
    }

    // Find the invitation for the user to be removed
    const invitation = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_and_email', (q) =>
        q.eq('team_id', args.teamId).eq('invitee_email', args.memberEmail),
      )
      .first();

    if (!invitation) {
      throw new Error('User not found in team');
    }

    // Remove team member if exists
    const teamMember = await ctx.db
      .query('team_members')
      .withIndex('by_invitation_id', (q) =>
        q.eq('invitation_id', invitation.id),
      )
      .first();

    if (teamMember) {
      // Prevent removing team owner
      if (teamMember.role === 'owner') {
        throw new Error('Cannot remove the team owner from the team');
      }

      await ctx.db.delete(teamMember._id);
    }

    // Remove the invitation
    await ctx.db.delete(invitation._id);

    return true;
  },
});

/**
 * Create a new team (internal function for subscription management)
 */
export const createTeam = internalMutation({
  args: {
    teamId: v.string(),
    teamName: v.string(),
    ownerId: v.string(),
    ownerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { teamId, teamName, ownerId, ownerEmail } = args;

    // Create the team
    await ctx.db.insert('teams', {
      id: teamId,
      name: teamName,
    });

    // Create invitation for the owner
    const invitationId = crypto.randomUUID();
    await ctx.db.insert('team_invitations', {
      id: invitationId,
      team_id: teamId,
      inviter_id: ownerId,
      invitee_email: ownerEmail,
      status: 'accepted',
      updated_at: Date.now(),
    });

    // Add the owner to the team
    await ctx.db.insert('team_members', {
      id: uuidv4(),
      team_id: teamId,
      user_id: ownerId,
      invitation_id: invitationId,
      role: 'owner',
    });

    return null;
  },
});

/**
 * Delete a team and all its members and invitations (internal function)
 */
export const deleteTeam = internalMutation({
  args: {
    teamId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { teamId } = args;

    // Delete all team members
    const teamMembers = await ctx.db
      .query('team_members')
      .filter((q) => q.eq(q.field('team_id'), teamId))
      .collect();

    for (const member of teamMembers) {
      await ctx.db.delete(member._id);
    }

    // Delete all team invitations
    const teamInvitations = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_id', (q) => q.eq('team_id', teamId))
      .collect();

    for (const invitation of teamInvitations) {
      await ctx.db.delete(invitation._id);
    }

    // Delete the team
    const team = await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('id'), teamId))
      .first();

    if (team) {
      await ctx.db.delete(team._id);
    }

    return null;
  },
});

/**
 * Get team by ID (internal function)
 */
export const getTeamById = internalQuery({
  args: {
    teamId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('teams'),
      _creationTime: v.number(),
      id: v.string(),
      name: v.string(),
      updated_at: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('id'), args.teamId))
      .first();

    return team;
  },
});
