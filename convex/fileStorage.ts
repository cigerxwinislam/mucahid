import { internalQuery, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get image URL from storage ID (public function)
 */
export const getImageUrlPublic = query({
  args: {
    serviceKey: v.string(),
    storageId: v.id('_storage'),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return null;
    }

    try {
      const url = await ctx.storage.getUrl(args.storageId);
      return url;
    } catch (error) {
      console.error('[STORAGE] Failed to get image URL', {
        error: error instanceof Error ? error.message : String(error),
        storageId: args.storageId,
      });
      return null;
    }
  },
});

/**
 * Get image URL from storage ID (internal function)
 */
export const getImageUrl = internalQuery({
  args: {
    storageId: v.id('_storage'),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId);
      return url;
    } catch (error) {
      console.error('[STORAGE] Failed to get image URL', {
        error: error instanceof Error ? error.message : String(error),
        storageId: args.storageId,
      });
      return null;
    }
  },
});
