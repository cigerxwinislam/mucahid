import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  query,
  action,
} from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';

export const createChatAction = action({
  args: {
    serviceKey: v.string(),
    chat: v.object({
      id: v.string(),
      user_id: v.string(),
      model: v.string(),
      name: v.string(),
      finish_reason: v.string(),
      sharing: v.union(v.literal('private'), v.literal('public')),
      updated_at: v.number(),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Unauthorized: Invalid service key',
      };
    }

    try {
      const result: { success: boolean; error?: string } =
        await ctx.runMutation(internal.chats.createChatInternal, {
          chat: args.chat,
        });
      return result;
    } catch (error) {
      console.error('Error in createChatAction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Action for updating chat with service role authentication
export const updateChatAction = action({
  args: {
    serviceKey: v.string(),
    chatId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      updated_at: v.optional(v.number()),
      finish_reason: v.optional(v.string()),
      model: v.optional(v.string()),
      sharing: v.optional(v.union(v.literal('private'), v.literal('public'))),
      last_shared_message_id: v.optional(v.string()),
      shared_by: v.optional(v.string()),
      shared_at: v.optional(v.number()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify service role key
    if (args.serviceKey !== process.env.CONVEX_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Unauthorized: Invalid service key',
      };
    }

    try {
      const result: { success: boolean; error?: string } =
        await ctx.runMutation(internal.chats.InternalUpdateChat, {
          chatId: args.chatId,
          updates: args.updates,
        });
      return result;
    } catch (error) {
      console.error('Error in updateChatAction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Internal mutation for creating chat
export const createChatInternal = internalMutation({
  args: {
    chat: v.object({
      id: v.string(),
      user_id: v.string(),
      model: v.string(),
      name: v.string(),
      finish_reason: v.string(),
      sharing: v.union(v.literal('private'), v.literal('public')),
      updated_at: v.number(),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert('chats', args.chat);
      return { success: true };
    } catch (error) {
      console.error('Error creating chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Helper function for shared chat update logic
const updateChatHelper = async (
  ctx: MutationCtx,
  chatId: string,
  updates: {
    name?: string;
    updated_at?: number;
    finish_reason?: string;
    model?: string;
    sharing?: 'private' | 'public';
    last_shared_message_id?: string;
    shared_by?: string;
    shared_at?: number;
  },
) => {
  try {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', chatId))
      .first();

    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }

    const updateData = { ...updates };
    if (updateData.updated_at === undefined) {
      updateData.updated_at = Date.now();
    }

    await ctx.db.patch(chat._id, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const InternalUpdateChat = internalMutation({
  args: {
    chatId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      updated_at: v.optional(v.number()),
      finish_reason: v.optional(v.string()),
      model: v.optional(v.string()),
      sharing: v.optional(v.union(v.literal('private'), v.literal('public'))),
      last_shared_message_id: v.optional(v.string()),
      shared_by: v.optional(v.string()),
      shared_at: v.optional(v.number()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return updateChatHelper(ctx, args.chatId, args.updates);
  },
});

export const getChatById = internalQuery({
  args: {
    chatId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('chats'),
      _creationTime: v.number(),
      id: v.string(),
      user_id: v.string(),
      model: v.string(),
      name: v.string(),
      finish_reason: v.optional(v.string()),
      sharing: v.union(v.literal('private'), v.literal('public')),
      last_shared_message_id: v.optional(v.string()),
      shared_at: v.optional(v.number()),
      shared_by: v.optional(v.string()),
      updated_at: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const chat = await ctx.db
        .query('chats')
        .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
        .first();
      return chat ?? null;
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get chat',
      );
    }
  },
});

export const deleteChat = internalMutation({
  args: {
    chatId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const chat = await ctx.db
        .query('chats')
        .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
        .first();

      if (!chat) {
        return { success: false, error: 'Chat not found' };
      }

      // First delete all files and their items associated with this chat
      const files = await ctx.db
        .query('files')
        .withIndex('by_chat_id', (q) => q.eq('chat_id', args.chatId))
        .collect();

      // Delete all file items and files
      for (const file of files) {
        try {
          // Get and delete all file items for this file
          const fileItems = await ctx.db
            .query('file_items')
            .withIndex('by_file_id', (q) => q.eq('file_id', file._id))
            .collect();

          // Delete all file items
          for (const item of fileItems) {
            await ctx.db.delete(item._id);
          }

          // Delete the file itself
          await ctx.db.delete(file._id);
        } catch (deleteError) {
          console.error(`Error deleting file ${file._id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      // Get all messages associated with this chat
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_chat_id', (q) => q.eq('chat_id', args.chatId))
        .collect();

      // Delete images from storage before deleting messages
      const allImagePaths: string[] = [];
      messages.forEach((message) => {
        if (message.image_paths && message.image_paths.length > 0) {
          allImagePaths.push(...message.image_paths);
        }
      });

      // Delete all images from storage
      if (allImagePaths.length > 0) {
        const imageDeletions = allImagePaths.map((storageIdString) => {
          try {
            // Convert string to storage ID
            const storageId = storageIdString as Id<'_storage'>;
            return ctx.storage.delete(storageId);
          } catch (error) {
            console.error(
              'Failed to delete storage file:',
              storageIdString,
              error,
            );
            return Promise.resolve(); // Continue with other deletions even if one fails
          }
        });
        await Promise.all(imageDeletions);
      }

      // Delete all messages
      for (const message of messages) {
        try {
          await ctx.db.delete(message._id);
        } catch (deleteError) {
          console.error(`Error deleting message ${message.id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      // Finally delete the chat itself
      await ctx.db.delete(chat._id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting chat and associated data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const deleteAllChats = internalMutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // First delete all file items for this user
      const fileItems = await ctx.db
        .query('file_items')
        .filter((q) => q.eq('user_id', args.userId))
        .collect();

      // Delete all file items
      for (const item of fileItems) {
        try {
          await ctx.db.delete(item._id);
        } catch (deleteError) {
          console.error(`Error deleting file item ${item._id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      // Then delete all files for this user
      const files = await ctx.db
        .query('files')
        .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
        .collect();

      // Delete all files
      for (const file of files) {
        try {
          await ctx.db.delete(file._id);
        } catch (deleteError) {
          console.error(`Error deleting file ${file._id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      // Get all messages for this user
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
        .collect();

      // Delete images from storage before deleting messages
      const allImagePaths: string[] = [];
      messages.forEach((message) => {
        if (message.image_paths && message.image_paths.length > 0) {
          allImagePaths.push(...message.image_paths);
        }
      });

      // Delete all images from storage
      if (allImagePaths.length > 0) {
        const imageDeletions = allImagePaths.map((storageIdString) => {
          try {
            // Convert string to storage ID
            const storageId = storageIdString as Id<'_storage'>;
            return ctx.storage.delete(storageId);
          } catch (error) {
            console.error(
              'Failed to delete storage file:',
              storageIdString,
              error,
            );
            return Promise.resolve(); // Continue with other deletions even if one fails
          }
        });
        await Promise.all(imageDeletions);
      }

      // Delete all messages
      for (const message of messages) {
        try {
          await ctx.db.delete(message._id);
        } catch (deleteError) {
          console.error(`Error deleting message ${message.id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      // Finally delete all chats for this user
      const chats = await ctx.db
        .query('chats')
        .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
        .collect();

      // Delete all chats
      for (const chat of chats) {
        try {
          await ctx.db.delete(chat._id);
        } catch (deleteError) {
          console.error(`Error deleting chat ${chat.id}:`, deleteError);
          // Continue with other deletions even if one fails
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting all chats and associated data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getChatsByUserId = internalQuery({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    chats: v.array(
      v.object({
        _id: v.id('chats'),
        _creationTime: v.number(),
        id: v.string(),
        user_id: v.string(),
        model: v.string(),
        name: v.string(),
        finish_reason: v.optional(v.string()),
        sharing: v.union(v.literal('private'), v.literal('public')),
        last_shared_message_id: v.optional(v.string()),
        shared_at: v.optional(v.number()),
        shared_by: v.optional(v.string()),
        updated_at: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    try {
      const result = await ctx.db
        .query('chats')
        .withIndex('by_user_and_updated', (q) => q.eq('user_id', args.userId))
        .order('desc')
        .paginate(args.paginationOpts);

      return {
        chats: result.page,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    } catch (error) {
      console.error('Error getting chats by user ID:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get chats',
      );
    }
  },
});

// export const getLastSharedMessageId = query({
//   args: {
//     chatId: v.string(),
//   },
//   returns: v.union(v.string(), v.null()),
//   handler: async (ctx, args) => {
//     try {
//       const chat = await ctx.db
//         .query('chats')
//         .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
//         .filter((q) => q.eq(q.field('sharing'), 'public'))
//         .unique();

//       return chat?.last_shared_message_id ?? null;
//     } catch (error) {
//       console.error('Error getting last shared message ID:', error);
//       throw new Error(error instanceof Error ? error.message : 'Failed to get last shared message ID');
//     }
//   },
// });

// export const getSharedChatsByUserId = query({
//   args: {
//     userId: v.string(),
//   },
//   returns: v.array(
//     v.object({
//       _id: v.id('chats'),
//       _creationTime: v.number(),
//       id: v.string(),
//       user_id: v.string(),
//       model: v.string(),
//       name: v.string(),
//       finish_reason: v.optional(v.string()),
//       sharing: v.union(v.literal('private'), v.literal('public')),
//       last_shared_message_id: v.optional(v.string()),
//       shared_at: v.optional(v.number()),
//       shared_by: v.optional(v.string()),
//       updated_at: v.optional(v.number()),
//     }),
//   ),
//   handler: async (ctx, args) => {
//     try {
//       const chats = await ctx.db
//         .query('chats')
//         .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
//         .filter((q) => q.eq(q.field('sharing'), 'public'))
//         .order('desc')
//         .collect();

//       return chats;
//     } catch (error) {
//       console.error('Error getting shared chats by user ID:', error);
//       throw new Error(error instanceof Error ? error.message : 'Failed to get shared chats');
//     }
//   },
// });

export const getChatByIdWithValidation = query({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('chats'),
      _creationTime: v.number(),
      id: v.string(),
      user_id: v.string(),
      model: v.string(),
      name: v.string(),
      finish_reason: v.optional(v.string()),
      sharing: v.union(v.literal('private'), v.literal('public')),
      last_shared_message_id: v.optional(v.string()),
      shared_at: v.optional(v.number()),
      shared_by: v.optional(v.string()),
      updated_at: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const chat = await ctx.db
        .query('chats')
        .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
        .first();

      // If chat doesn't exist, return null
      if (!chat) {
        return null;
      }

      if (chat.user_id === args.userId) {
        return chat;
      }

      // If user is not authorized, throw an error
      throw new Error('Unauthorized access to chat');
    } catch (error) {
      console.error('Error validating chat access:', error);
      throw error;
    }
  },
});
