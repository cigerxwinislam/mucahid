import { query } from './_generated/server';
import { v } from 'convex/values';
import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

/**
 * Get file items by file ID
 */
export const getFileItemsByFileId = query({
  args: { fileId: v.id('files') },
  returns: v.array(
    v.object({
      _id: v.id('file_items'),
      _creationTime: v.number(),
      file_id: v.id('files'),
      user_id: v.string(),
      content: v.string(),
      tokens: v.number(),
      name: v.optional(v.string()),
      sequence_number: v.number(),
      updated_at: v.optional(v.number()),
      message_id: v.optional(v.string()),
      chat_id: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const fileItems = await ctx.db
      .query('file_items')
      .withIndex('by_file_id', (q) => q.eq('file_id', args.fileId))
      .order('asc')
      .collect();

    return fileItems;
  },
});

/**
 * Get all file items for multiple file IDs in a single query
 */
export const getAllFileItemsByFileIds = query({
  args: {
    serviceKey: v.string(),
    fileIds: v.array(v.id('files')),
  },
  returns: v.union(
    v.array(
      v.object({
        _id: v.id('file_items'),
        _creationTime: v.number(),
        file_id: v.id('files'),
        user_id: v.string(),
        content: v.string(),
        tokens: v.number(),
        name: v.optional(v.string()),
        sequence_number: v.number(),
        updated_at: v.optional(v.number()),
        message_id: v.optional(v.string()),
        chat_id: v.optional(v.string()),
      }),
    ),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      console.error('Unauthorized access attempt to getAllFileItemsByFileIds');
      return null;
    }

    try {
      // Since Convex doesn't support 'in' queries directly, we'll use a more efficient approach
      // by querying all file items and filtering in memory
      const allFileItems = await ctx.db.query('file_items').collect();

      // Filter items that match any of the provided file IDs
      return allFileItems.filter((item) => args.fileIds.includes(item.file_id));
    } catch (error) {
      console.error('Error in getAllFileItemsByFileIds:', error);
      return null;
    }
  },
});

/**
 * Upsert multiple file items
 */
export const upsertFileItems = mutation({
  args: {
    serviceKey: v.string(),
    fileItems: v.array(
      v.object({
        file_id: v.id('files'),
        user_id: v.string(),
        sequence_number: v.number(),
        content: v.string(),
        tokens: v.number(),
        name: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Unauthorized: Invalid service key',
      };
    }

    try {
      for (const item of args.fileItems) {
        // Check if an item with the same file_id exists
        const existingItems = await ctx.db
          .query('file_items')
          .withIndex('by_file_id', (q) => q.eq('file_id', item.file_id))
          .collect();

        if (existingItems.length > 0) {
          // Update the first existing item (since they all have sequence_number 0)
          const existingItem = existingItems[0];
          await ctx.db.patch(existingItem._id, {
            content: item.content,
            tokens: item.tokens,
            name: item.name,
            updated_at: Date.now(),
          });
        } else {
          // Insert new item
          await ctx.db.insert('file_items', {
            file_id: item.file_id,
            user_id: item.user_id,
            content: item.content,
            tokens: item.tokens,
            name: item.name,
            sequence_number: item.sequence_number,
            updated_at: Date.now(),
          });
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error in upsertFileItems:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Update file items with message and chat relationships
 */
export const updateFileItemsWithMessage = mutation({
  args: {
    serviceKey: v.string(),
    fileItems: v.array(
      v.object({
        _id: v.id('file_items'),
        file_id: v.id('files'),
        user_id: v.string(),
        content: v.string(),
        tokens: v.number(),
        name: v.optional(v.string()),
        sequence_number: v.number(),
      }),
    ),
    messageId: v.string(),
    chatId: v.string(),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return false;
    }

    try {
      // Keep track of unique file IDs we've processed
      const processedFileIds = new Set<Id<'files'>>();

      for (const fileItem of args.fileItems) {
        // Find the file item by ID
        const existingItem = await ctx.db.get(fileItem._id);

        if (existingItem) {
          // Update existing file item
          await ctx.db.patch(fileItem._id, {
            message_id: args.messageId,
            chat_id: args.chatId,
            updated_at: Date.now(),
          });
        } else {
          // Create new file item with relationships
          await ctx.db.insert('file_items', {
            ...fileItem,
            message_id: args.messageId,
            chat_id: args.chatId,
            updated_at: Date.now(),
          });
        }

        // Add file_id to processed set if not already processed
        if (!processedFileIds.has(fileItem.file_id)) {
          processedFileIds.add(fileItem.file_id);

          // Find and update the associated file
          const file = await ctx.db.get(fileItem.file_id);

          if (file) {
            // Update the file with message and chat relationships
            await ctx.db.patch(file._id, {
              message_id: args.messageId,
              chat_id: args.chatId,
              updated_at: Date.now(),
            });
          }
        }
      }
      return true;
    } catch (error) {
      console.error('[updateFileItemsWithMessage] Error:', error);
      return false;
    }
  },
});

/**
 * Get file items by message ID
 */
export const getFileItemsByMessageId = query({
  args: {
    messageId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id('file_items'),
      _creationTime: v.number(),
      file_id: v.id('files'),
      user_id: v.string(),
      content: v.string(),
      tokens: v.number(),
      name: v.optional(v.string()),
      sequence_number: v.number(),
      updated_at: v.optional(v.number()),
      message_id: v.optional(v.string()),
      chat_id: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      // Get file items for this message
      const fileItems = await ctx.db
        .query('file_items')
        .withIndex('by_message_id', (q) => q.eq('message_id', args.messageId))
        .collect();

      return fileItems;
    } catch (error) {
      console.error('[getFileItemsByMessageId] Error:', error);
      return [];
    }
  },
});
