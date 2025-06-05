import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get an existing sandbox for a user and template
 */
export const getSandbox = query({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
    template: v.string(),
  },
  returns: v.union(
    v.object({
      sandbox_id: v.string(),
      status: v.union(
        v.literal('active'),
        v.literal('pausing'),
        v.literal('paused'),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const sandbox = await ctx.db
      .query('sandboxes')
      .withIndex('by_user_and_template', (q) =>
        q.eq('user_id', args.userId).eq('template', args.template),
      )
      .filter((q) => q.gt(q.field('updated_at'), thirtyDaysAgo))
      .first();

    return sandbox
      ? {
          sandbox_id: sandbox.sandbox_id,
          status: sandbox.status,
        }
      : null;
  },
});

/**
 * Create or update a sandbox record
 */
export const upsertSandbox = mutation({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
    sandboxId: v.string(),
    template: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('pausing'),
      v.literal('paused'),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    const existingSandbox = await ctx.db
      .query('sandboxes')
      .withIndex('by_user_and_template', (q) =>
        q.eq('user_id', args.userId).eq('template', args.template),
      )
      .first();

    if (existingSandbox) {
      await ctx.db.patch(existingSandbox._id, {
        sandbox_id: args.sandboxId,
        status: args.status,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert('sandboxes', {
        user_id: args.userId,
        sandbox_id: args.sandboxId,
        template: args.template,
        status: args.status,
        updated_at: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Update sandbox status
 */
export const updateSandboxStatus = mutation({
  args: {
    serviceKey: v.string(),
    sandboxId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('pausing'),
      v.literal('paused'),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    const sandbox = await ctx.db
      .query('sandboxes')
      .withIndex('by_sandbox_id', (q) => q.eq('sandbox_id', args.sandboxId))
      .first();

    if (sandbox) {
      await ctx.db.patch(sandbox._id, {
        status: args.status,
        updated_at: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Delete a sandbox record
 */
export const deleteSandbox = mutation({
  args: {
    serviceKey: v.string(),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    const sandbox = await ctx.db
      .query('sandboxes')
      .withIndex('by_sandbox_id', (q) => q.eq('sandbox_id', args.sandboxId))
      .first();

    if (sandbox) {
      await ctx.db.delete(sandbox._id);
    }
    return null;
  },
});
