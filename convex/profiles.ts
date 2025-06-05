import { internalMutation, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get AI profile context by user ID with service key (for server-side usage) - creates profile if it doesn't exist
 */
export const getAIProfilePublic = mutation({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    user_id: v.string(),
    profile_context: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      throw new Error('Unauthorized');
    }

    let profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .unique();

    // Create profile if it doesn't exist
    if (!profile) {
      const profileId = await ctx.db.insert('profiles', {
        user_id: args.userId,
      });

      profile = await ctx.db.get(profileId);
      if (!profile) {
        throw new Error('Failed to retrieve created profile');
      }
    }

    return {
      user_id: profile.user_id,
      profile_context: profile.profile_context,
    };
  },
});

/**
 * Get profile by user ID or create if it doesn't exist
 */
export const getOrCreateProfile = internalMutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    _id: v.id('profiles'),
    _creationTime: v.number(),
    user_id: v.string(),
    image_url: v.optional(v.string()),
    profile_context: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First try to get existing profile
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .unique();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile if it doesn't exist
    const profileId = await ctx.db.insert('profiles', {
      user_id: args.userId,
    });

    const createdProfile = await ctx.db.get(profileId);
    if (!createdProfile) {
      throw new Error('Failed to retrieve created profile');
    }

    return createdProfile;
  },
});

/**
 * Update an existing profile or create if it doesn't exist
 */
export const updateProfile = internalMutation({
  args: {
    userId: v.string(),
    profile_context: v.string(),
  },
  returns: v.object({
    _id: v.id('profiles'),
    _creationTime: v.number(),
    user_id: v.string(),
    image_url: v.optional(v.string()),
    profile_context: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .unique();

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const profileId = await ctx.db.insert('profiles', {
        user_id: args.userId,
        profile_context: args.profile_context,
      });

      const createdProfile = await ctx.db.get(profileId);
      if (!createdProfile) {
        throw new Error('Failed to retrieve created profile');
      }
      return createdProfile;
    }

    // Update existing profile
    await ctx.db.patch(existingProfile._id, {
      profile_context: args.profile_context,
    });

    const updatedProfile = await ctx.db.get(existingProfile._id);
    if (!updatedProfile) {
      throw new Error('Failed to retrieve updated profile');
    }

    return updatedProfile;
  },
});

/**
 * Update profile avatar - creates profile if it doesn't exist
 */
export const updateProfileAvatar = mutation({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
    avatarUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return false;
    }

    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .unique();

    // Create profile if it doesn't exist
    if (!existingProfile) {
      await ctx.db.insert('profiles', {
        user_id: args.userId,
        image_url: args.avatarUrl,
      });
      return true;
    }

    // Only update avatar if user doesn't already have one
    if (!existingProfile.image_url) {
      await ctx.db.patch(existingProfile._id, {
        image_url: args.avatarUrl,
      });
      return true;
    }

    // Return false if avatar already exists (no update needed)
    return false;
  },
});
