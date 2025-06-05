import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from './_generated/server';
import { v } from 'convex/values';
import { v4 as uuidv4 } from 'uuid';
import { internal } from './_generated/api';

/**
 * Check if a user has an active subscription or team membership
 * Returns the user's plan type
 * Requires service role key for server-side calls
 */
export const checkSubscription = query({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    planType: v.union(v.literal('free'), v.literal('pro'), v.literal('team')),
  }),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        planType: 'free' as const,
      };
    }

    // First check for team membership
    const teamMember = await ctx.db
      .query('team_members')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .first();

    if (teamMember) {
      return {
        planType: 'team' as const,
      };
    }

    // If no team membership, check for active subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user_and_status', (q) =>
        q.eq('user_id', args.userId).eq('status', 'active'),
      )
      .first();

    if (!subscription) {
      return {
        planType: 'free' as const,
      };
    }

    return {
      planType: 'pro' as const,
    };
  },
});

/**
 * Upsert a subscription record
 * Used by Stripe webhook to create or update subscription data
 * Now includes team management logic
 *
 * IMPORTANT: When migrating from Supabase, ensure userEmail is always provided
 * for team subscriptions to maintain proper seat counting and invitation tracking.
 */
export const upsertSubscription = mutation({
  args: {
    serviceKey: v.string(),
    subscriptionId: v.string(),
    userId: v.string(),
    customerId: v.string(),
    status: v.string(),
    startDate: v.union(v.string(), v.null()),
    cancelAt: v.union(v.string(), v.null()),
    canceledAt: v.union(v.string(), v.null()),
    endedAt: v.union(v.string(), v.null()),
    planType: v.string(),
    teamName: v.optional(v.string()),
    quantity: v.number(),
    userEmail: v.optional(v.string()), // REQUIRED for team subscriptions - owner's email
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    // Validate that userEmail is provided for team subscriptions
    if (args.planType === 'team' && !args.userEmail) {
      console.error('userEmail is required for team subscriptions');
      throw new Error('userEmail is required for team subscriptions');
    }

    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscription_id', (q) =>
        q.eq('subscription_id', args.subscriptionId),
      )
      .first();

    let newSubscription;
    const oldSubscription = existingSubscription;

    if (existingSubscription) {
      // Update existing subscription - preserve the existing id
      const subscriptionData = {
        subscription_id: args.subscriptionId,
        user_id: args.userId,
        customer_id: args.customerId,
        status: args.status,
        start_date: args.startDate,
        cancel_at: args.cancelAt,
        canceled_at: args.canceledAt,
        ended_at: args.endedAt,
        plan_type: args.planType,
        team_name: args.teamName,
        quantity: args.quantity,
      };

      await ctx.db.patch(existingSubscription._id, subscriptionData);
      newSubscription = { ...existingSubscription, ...subscriptionData };
    } else {
      // Create new subscription - generate new UUID for id
      const subscriptionData = {
        id: uuidv4(),
        subscription_id: args.subscriptionId,
        user_id: args.userId,
        customer_id: args.customerId,
        status: args.status,
        start_date: args.startDate,
        cancel_at: args.cancelAt,
        canceled_at: args.canceledAt,
        ended_at: args.endedAt,
        plan_type: args.planType,
        team_name: args.teamName,
        quantity: args.quantity,
      };

      const subscriptionId = await ctx.db.insert(
        'subscriptions',
        subscriptionData,
      );
      newSubscription = { ...subscriptionData, _id: subscriptionId };
    }

    // Handle team management logic - only run when team plans are involved
    const isTeamRelated =
      newSubscription.plan_type === 'team' ||
      (oldSubscription && oldSubscription.plan_type === 'team');

    if (isTeamRelated) {
      await ctx.runMutation(
        internal.subscriptions.manageTeamOnSubscriptionChange,
        {
          oldSubscription: oldSubscription
            ? {
                team_id: (oldSubscription as any).team_id || undefined,
                plan_type: oldSubscription.plan_type,
                quantity: oldSubscription.quantity,
              }
            : null,
          newSubscription: {
            id: newSubscription.id,
            team_id: (newSubscription as any).team_id || undefined,
            plan_type: newSubscription.plan_type,
            quantity: newSubscription.quantity,
            team_name: newSubscription.team_name,
            user_id: newSubscription.user_id,
          },
          userEmail: args.userEmail,
        },
      );
    }

    return null;
  },
});

/**
 * Internal function to manage team creation, deletion, and member management
 * when subscription changes occur
 */
export const manageTeamOnSubscriptionChange = internalMutation({
  args: {
    oldSubscription: v.union(
      v.object({
        team_id: v.optional(v.string()),
        plan_type: v.string(),
        quantity: v.number(),
      }),
      v.null(),
    ),
    newSubscription: v.object({
      id: v.string(),
      team_id: v.optional(v.string()),
      plan_type: v.string(),
      quantity: v.number(),
      team_name: v.optional(v.string()),
      user_id: v.string(),
    }),
    userEmail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { oldSubscription, newSubscription, userEmail } = args;

    // If the new plan type is 'team' and it wasn't before, or if it's a new team subscription
    if (
      !newSubscription.team_id &&
      newSubscription.plan_type === 'team' &&
      (!oldSubscription || oldSubscription.plan_type !== 'team')
    ) {
      // Create a new team
      const teamId = uuidv4();
      await ctx.db.insert('teams', {
        id: teamId,
        name: newSubscription.team_name || 'New Team',
      });

      // Update the subscription with the new team_id
      const subscription = await ctx.db
        .query('subscriptions')
        .filter((q) => q.eq(q.field('id'), newSubscription.id))
        .first();

      if (subscription) {
        await ctx.db.patch(subscription._id, {
          team_id: teamId,
        });
      }

      // Create a team_invitation for the owner if we have their email
      // This is crucial for proper seat counting
      if (userEmail) {
        const invitationId = uuidv4();
        await ctx.db.insert('team_invitations', {
          id: invitationId,
          team_id: teamId,
          inviter_id: newSubscription.user_id,
          invitee_email: userEmail,
          status: 'accepted',
          updated_at: Date.now(),
        });

        // Add the subscription owner to the team as an owner
        // Link to the invitation for proper tracking
        await ctx.db.insert('team_members', {
          id: uuidv4(),
          team_id: teamId,
          user_id: newSubscription.user_id,
          invitation_id: invitationId,
          role: 'owner',
        });
      } else {
        // If we don't have the user's email, we need to get it somehow
        // For now, we'll create the team member without an invitation
        // This should be avoided in production - userEmail should always be provided
        console.warn(
          'Creating team without owner invitation - userEmail not provided',
        );
        await ctx.db.insert('team_members', {
          id: uuidv4(),
          team_id: teamId,
          user_id: newSubscription.user_id,
          role: 'owner',
        });
      }
    }
    // If the old plan type was 'team' and the new one isn't
    else if (
      oldSubscription &&
      oldSubscription.plan_type === 'team' &&
      newSubscription.plan_type !== 'team' &&
      oldSubscription.team_id
    ) {
      // Delete all team members
      const teamMembers = await ctx.db
        .query('team_members')
        .filter((q) => q.eq(q.field('team_id'), oldSubscription.team_id!))
        .collect();

      for (const member of teamMembers) {
        await ctx.db.delete(member._id);
      }

      // Delete all team invitations
      const teamInvitations = await ctx.db
        .query('team_invitations')
        .withIndex('by_team_id', (q) =>
          q.eq('team_id', oldSubscription.team_id!),
        )
        .collect();

      for (const invitation of teamInvitations) {
        await ctx.db.delete(invitation._id);
      }

      // Delete the team
      const team = await ctx.db
        .query('teams')
        .filter((q) => q.eq(q.field('id'), oldSubscription.team_id!))
        .first();

      if (team) {
        await ctx.db.delete(team._id);
      }

      // Update subscription to remove team_id
      const subscription = await ctx.db
        .query('subscriptions')
        .filter((q) => q.eq(q.field('id'), newSubscription.id))
        .first();

      if (subscription) {
        await ctx.db.patch(subscription._id, {
          team_id: undefined,
        });
      }
    }
    // If the quantity has been reduced and we have a team
    else if (
      oldSubscription &&
      newSubscription.quantity < oldSubscription.quantity &&
      newSubscription.team_id
    ) {
      await ctx.runMutation(internal.subscriptions.removeExcessTeamMembers, {
        teamId: newSubscription.team_id,
        newQuantity: newSubscription.quantity,
        ownerId: newSubscription.user_id,
      });
    }

    return null;
  },
});

/**
 * Internal function to remove excess team members when subscription quantity is reduced
 * Matches the Supabase logic exactly
 */
export const removeExcessTeamMembers = internalMutation({
  args: {
    teamId: v.string(),
    newQuantity: v.number(),
    ownerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { teamId, newQuantity, ownerId } = args;

    // Get current count of all invitations (accepted, pending, rejected)
    // This matches the Supabase logic: SELECT COUNT(*) FROM team_invitations WHERE team_id = NEW.team_id
    const allInvitations = await ctx.db
      .query('team_invitations')
      .withIndex('by_team_id', (q) => q.eq('team_id', teamId))
      .collect();

    let membersToRemove = allInvitations.length - newQuantity;

    if (membersToRemove <= 0) {
      return null;
    }

    // Step 1: Remove rejected invitations first
    // ORDER BY created_at DESC (we use _creationTime since created_at doesn't exist)
    const rejectedInvitations = allInvitations
      .filter((inv) => inv.status === 'rejected')
      .sort((a, b) => b._creationTime - a._creationTime);

    for (const invitation of rejectedInvitations) {
      if (membersToRemove <= 0) break;
      await ctx.db.delete(invitation._id);
      membersToRemove--;
    }

    // Recount after removing rejected invitations
    if (membersToRemove <= 0) return null;

    // Step 2: Remove pending invitations
    const pendingInvitations = allInvitations
      .filter((inv) => inv.status === 'pending')
      .sort((a, b) => b._creationTime - a._creationTime);

    for (const invitation of pendingInvitations) {
      if (membersToRemove <= 0) break;
      await ctx.db.delete(invitation._id);
      membersToRemove--;
    }

    if (membersToRemove <= 0) return null;

    // Step 3: Remove non-admin team members (but not the owner)
    // JOIN team_members to get role information
    const acceptedInvitations = allInvitations
      .filter((inv) => inv.status === 'accepted')
      .sort((a, b) => b._creationTime - a._creationTime);

    for (const invitation of acceptedInvitations) {
      if (membersToRemove <= 0) break;

      // Get the team member to check their role
      const teamMember = await ctx.db
        .query('team_members')
        .withIndex('by_invitation_id', (q) =>
          q.eq('invitation_id', invitation.id),
        )
        .first();

      // Skip if this is the owner or if no team member found
      // tm.user_id != NEW.user_id AND tm.role NOT IN ('admin', 'owner')
      if (
        !teamMember ||
        teamMember.user_id === ownerId ||
        teamMember.role === 'owner'
      ) {
        continue;
      }

      // Remove non-admin members first (member role)
      // Since our schema only has 'member' and 'owner', this handles 'member' role
      if (teamMember.role === 'member') {
        await ctx.db.delete(teamMember._id);
        await ctx.db.delete(invitation._id);
        membersToRemove--;
      }
    }

    if (membersToRemove <= 0) return null;

    // Step 4: Remove admin team members if necessary (but still not the owner)
    // Since only 'member' and 'owner' roles exist, this section handles any remaining members
    // In the original SQL, this would handle 'admin' role, but we don't have that
    // This is kept for completeness and future extensibility
    for (const invitation of acceptedInvitations) {
      if (membersToRemove <= 0) break;

      const teamMember = await ctx.db
        .query('team_members')
        .withIndex('by_invitation_id', (q) =>
          q.eq('invitation_id', invitation.id),
        )
        .first();

      // Skip if this is the owner or if no team member found
      if (
        !teamMember ||
        teamMember.user_id === ownerId ||
        teamMember.role === 'owner'
      ) {
        continue;
      }

      // Remove any remaining non-owner members
      // This would handle 'admin' role if it existed in the schema
      await ctx.db.delete(teamMember._id);
      await ctx.db.delete(invitation._id);
      membersToRemove--;
    }

    return null;
  },
});

/**
 * Delete a subscription record
 * Used by Stripe webhook when a subscription is deleted
 * Now includes team cleanup logic
 */
export const deleteSubscription = mutation({
  args: {
    serviceKey: v.string(),
    subscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    // Find the subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscription_id', (q) =>
        q.eq('subscription_id', args.subscriptionId),
      )
      .first();

    if (subscription) {
      // If this was a team subscription, clean up the team first
      if (subscription.plan_type === 'team' && subscription.team_id) {
        await ctx.runMutation(
          internal.subscriptions.cleanupTeamOnSubscriptionDeletion,
          {
            teamId: subscription.team_id,
          },
        );
      }

      await ctx.db.delete(subscription._id);
    }

    return null;
  },
});

/**
 * Internal function to clean up team when subscription is deleted
 */
export const cleanupTeamOnSubscriptionDeletion = internalMutation({
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
 * Get subscription by user ID
 * Internal function for HTTP actions
 */
export const getSubscriptionByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('subscriptions'),
      _creationTime: v.number(),
      id: v.string(),
      subscription_id: v.string(),
      user_id: v.string(),
      customer_id: v.string(),
      status: v.string(),
      start_date: v.union(v.string(), v.null()),
      cancel_at: v.union(v.string(), v.null()),
      canceled_at: v.union(v.string(), v.null()),
      ended_at: v.union(v.string(), v.null()),
      plan_type: v.string(),
      team_name: v.optional(v.string()),
      team_id: v.optional(v.string()),
      quantity: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get active subscription for user
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user_and_status', (q) =>
        q.eq('user_id', args.userId).eq('status', 'active'),
      )
      .first();

    return subscription;
  },
});

/**
 * Get subscription by team ID
 * Internal function for HTTP actions
 */
export const getSubscriptionByTeamId = internalQuery({
  args: {
    teamId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('subscriptions'),
      _creationTime: v.number(),
      id: v.string(),
      subscription_id: v.string(),
      user_id: v.string(),
      customer_id: v.string(),
      status: v.string(),
      start_date: v.union(v.string(), v.null()),
      cancel_at: v.union(v.string(), v.null()),
      canceled_at: v.union(v.string(), v.null()),
      ended_at: v.union(v.string(), v.null()),
      plan_type: v.string(),
      team_name: v.optional(v.string()),
      team_id: v.optional(v.string()),
      quantity: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get active subscription for team
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_team_id', (q) => q.eq('team_id', args.teamId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first();

    return subscription;
  },
});

/**
 * Get subscription by user ID (public query for server-side use)
 * Requires service role key for server-side calls
 */
export const getSubscriptionByUserIdPublic = query({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('subscriptions'),
      _creationTime: v.number(),
      id: v.string(),
      subscription_id: v.string(),
      user_id: v.string(),
      customer_id: v.string(),
      status: v.string(),
      start_date: v.union(v.string(), v.null()),
      cancel_at: v.union(v.string(), v.null()),
      canceled_at: v.union(v.string(), v.null()),
      ended_at: v.union(v.string(), v.null()),
      plan_type: v.string(),
      team_name: v.optional(v.string()),
      team_id: v.optional(v.string()),
      quantity: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    // Get active subscription for user
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user_and_status', (q) =>
        q.eq('user_id', args.userId).eq('status', 'active'),
      )
      .first();

    return subscription;
  },
});
