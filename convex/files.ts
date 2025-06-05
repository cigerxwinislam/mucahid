import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

/**
 * Get count of files for a specific user
 */
export const getAllFilesCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query('files')
      .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
      .collect();
    return files.length;
  },
});

/**
 * Update multiple files with the same message_id and chat_id in a single operation
 */
export const updateFilesMessage = mutation({
  args: {
    serviceKey: v.string(),
    fileIds: v.array(v.id('files')),
    messageId: v.string(),
    chatId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.union(v.string(), v.null()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; error: string | null }> => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Unauthorized: Invalid service key',
      };
    }

    if (args.fileIds.length === 0) {
      return {
        success: false,
        error: 'No file IDs provided',
      };
    }

    try {
      // Get all files that match the ids and have no message_id
      const existingFiles = await ctx.db
        .query('files')
        .filter((q) => q.eq('message_id', null))
        .collect();

      // Create a set of file IDs for O(1) lookup
      const fileIdSet = new Set(args.fileIds);
      let updatedCount = 0;
      let failedCount = 0;

      // Update each file that exists and is unassigned
      for (const file of existingFiles) {
        if (fileIdSet.has(file._id)) {
          try {
            await ctx.db.patch(file._id, {
              message_id: args.messageId,
              chat_id: args.chatId,
              updated_at: Date.now(),
            });
            updatedCount++;
          } catch (error) {
            console.error(`Failed to update file ${file._id}:`, error);
            failedCount++;
          }
        }
      }

      // Check if any files were not found
      const notFoundCount = args.fileIds.filter(
        (id) => !existingFiles.some((f) => f._id === id),
      ).length;
      if (notFoundCount > 0) {
        failedCount += notFoundCount;
      }

      return {
        success: updatedCount > 0,
        error: failedCount > 0 ? `Failed to update ${failedCount} files` : null,
      };
    } catch (error) {
      console.error('[updateFilesMessage] Error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Retrieve and update files for a message at a specific sequence number
 */
export const retrieveAndUpdateFilesForMessage = mutation({
  args: {
    serviceKey: v.string(),
    chatId: v.string(),
    sequenceNumber: v.number(),
  },
  returns: v.object({
    files: v.array(
      v.object({
        _id: v.id('files'),
        _creationTime: v.number(),
        user_id: v.string(),
        file_path: v.string(),
        name: v.string(),
        size: v.number(),
        tokens: v.number(),
        type: v.string(),
        message_id: v.optional(v.string()),
        chat_id: v.optional(v.string()),
        updated_at: v.optional(v.number()),
      }),
    ),
    success: v.boolean(),
    error: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        files: [],
        success: false,
        error: 'Unauthorized: Invalid service key',
      };
    }

    try {
      const message = await ctx.runQuery(
        internal.messages.internalGetMessageAtSequence,
        {
          chatId: args.chatId,
          sequenceNumber: args.sequenceNumber,
        },
      );

      // If no message is found, this is not necessarily an error during edit operations
      // The message might have been deleted already or might not exist yet
      // Return success with empty files array
      if (!message) {
        return {
          files: [],
          success: true,
          error: null,
        };
      }

      // Get files associated with this message
      const files = (await ctx.db
        .query('files')
        .withIndex('by_message_id', (q) => q.eq('message_id', message.id))
        .collect()) as Doc<'files'>[];

      // Update files to remove message_id
      if (files.length > 0) {
        for (const file of files) {
          await ctx.db.patch(file._id, {
            message_id: undefined,
            updated_at: Date.now(),
          });
        }
      }

      return {
        files,
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('[retrieveAndUpdateFilesForMessage] Error:', error);
      return {
        files: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Get a single file by ID, user ID, or user ID + filename
 */
export const getFile = query({
  args: {
    fileId: v.optional(v.id('files')),
    userId: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id('files'),
      _creationTime: v.number(),
      user_id: v.string(),
      file_path: v.string(),
      name: v.string(),
      size: v.number(),
      tokens: v.number(),
      type: v.string(),
      message_id: v.optional(v.string()),
      chat_id: v.optional(v.string()),
      updated_at: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      // If fileId is provided, get file by ID
      if (args.fileId) {
        const file = await ctx.db.get(args.fileId);
        return file;
      }

      // If userId and fileName are provided, find file by user and name
      if (args.userId && args.fileName) {
        const file = await ctx.db
          .query('files')
          .withIndex('by_user_id', (q) =>
            q.eq('user_id', args.userId as string),
          )
          .filter((q) => q.eq('name', args.fileName as string))
          .unique();
        return file;
      }

      return null;
    } catch (error) {
      console.error('[getFile] Error:', error);
      return null;
    }
  },
});

/**
 * Get multiple files for a chat
 */
export const getFiles = query({
  args: {
    chatId: v.string(),
  },
  returns: v.union(
    v.array(
      v.object({
        _id: v.id('files'),
        _creationTime: v.number(),
        user_id: v.string(),
        file_path: v.string(),
        name: v.string(),
        size: v.number(),
        tokens: v.number(),
        type: v.string(),
        message_id: v.optional(v.string()),
        chat_id: v.optional(v.string()),
        updated_at: v.optional(v.number()),
      }),
    ),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const files = await ctx.db
        .query('files')
        .withIndex('by_chat_id', (q) => q.eq('chat_id', args.chatId))
        .collect();
      return files.length > 0 ? files : null;
    } catch (error) {
      console.error('[getFiles] Error:', error);
      return null;
    }
  },
});

/**
 * Create a new file
 */
export const createFile = mutation({
  args: {
    fileData: v.object({
      user_id: v.string(),
      file_path: v.string(),
      name: v.string(),
      size: v.number(),
      tokens: v.number(),
      type: v.string(),
    }),
  },
  returns: v.object({
    _id: v.id('files'),
    _creationTime: v.number(),
    user_id: v.string(),
    file_path: v.string(),
    name: v.string(),
    size: v.number(),
    tokens: v.number(),
    type: v.string(),
    message_id: v.optional(v.string()),
    chat_id: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert('files', {
      ...args.fileData,
      updated_at: Date.now(),
    });
    const file = await ctx.db.get(fileId);
    if (!file) {
      throw new Error('Failed to create file');
    }
    return file;
  },
});

/**
 * Update a file
 */
export const updateFile = mutation({
  args: {
    fileId: v.id('files'),
    fileData: v.object({
      file_path: v.optional(v.string()),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
      tokens: v.optional(v.number()),
      type: v.optional(v.string()),
      message_id: v.optional(v.string()),
      chat_id: v.optional(v.string()),
    }),
  },
  returns: v.object({
    _id: v.id('files'),
    _creationTime: v.number(),
    user_id: v.string(),
    file_path: v.string(),
    name: v.string(),
    size: v.number(),
    tokens: v.number(),
    type: v.string(),
    message_id: v.optional(v.string()),
    chat_id: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file) {
      throw new Error('File not found');
    }

    await ctx.db.patch(file._id, {
      ...args.fileData,
      updated_at: Date.now(),
    });

    const updatedFile = await ctx.db.get(file._id);
    if (!updatedFile) {
      throw new Error('Failed to get updated file');
    }
    return updatedFile;
  },
});

/**
 * Delete a file and its associated file items
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // First find the file to verify it exists
      const file = await ctx.db.get(args.fileId);

      if (!file) {
        throw new Error('File not found');
      }

      // Get all file items associated with this file
      const fileItems = await ctx.db
        .query('file_items')
        .withIndex('by_file_id', (q) => q.eq('file_id', args.fileId))
        .collect();

      // Delete all associated file items
      for (const item of fileItems) {
        await ctx.db.delete(item._id);
      }

      // Finally delete the file itself
      await ctx.db.delete(file._id);
      return true;
    } catch (error) {
      console.error('[deleteFile] Error:', error);
      return false;
    }
  },
});
