import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * Delete a profile and all associated user data
 */
export const deleteProfile = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Collect all data to be deleted in parallel for better performance
      const [
        feedback,
        fileItems,
        files,
        messages,
        chats,
        sandboxes,
        teamMembers,
        teamInvitations,
        subscriptions,
        existingProfile,
      ] = await Promise.all([
        // 1. Get feedback (references messages)
        ctx.db
          .query('feedback')
          .filter((q) => q.eq(q.field('user_id'), args.userId))
          .collect(),

        // 2. Get file_items (references files and user)
        ctx.db
          .query('file_items')
          .filter((q) => q.eq(q.field('user_id'), args.userId))
          .collect(),

        // 3. Get files (references user)
        ctx.db
          .query('files')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .collect(),

        // 4. Get messages (references user and chats)
        ctx.db
          .query('messages')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .collect(),

        // 5. Get chats (references user)
        ctx.db
          .query('chats')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .collect(),

        // 6. Get sandboxes (references user)
        ctx.db
          .query('sandboxes')
          .filter((q) => q.eq(q.field('user_id'), args.userId))
          .collect(),

        // 7. Get team_members (references user)
        ctx.db
          .query('team_members')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .collect(),

        // 8. Get team_invitations (references user email)
        args.userEmail
          ? ctx.db
              .query('team_invitations')
              .withIndex('by_invitee_email', (q) =>
                q.eq('invitee_email', args.userEmail!),
              )
              .collect()
          : Promise.resolve([]),

        // 9. Get subscriptions (references user)
        ctx.db
          .query('subscriptions')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .collect(),

        // 10. Get the profile itself
        ctx.db
          .query('profiles')
          .withIndex('by_user_id', (q) => q.eq('user_id', args.userId))
          .unique(),
      ]);

      // Perform all deletions in sequence to maintain referential integrity
      // Delete in reverse dependency order to avoid foreign key constraint issues

      // Delete feedback first (references messages)
      const feedbackDeletions = feedback.map((item) => ctx.db.delete(item._id));
      await Promise.all(feedbackDeletions);

      // Delete file_items (references files and user)
      const fileItemDeletions = fileItems.map((item) =>
        ctx.db.delete(item._id),
      );
      await Promise.all(fileItemDeletions);

      // Delete files (references user)
      const fileDeletions = files.map((file) => ctx.db.delete(file._id));
      await Promise.all(fileDeletions);

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

      // Delete messages (references user and chats)
      const messageDeletions = messages.map((message) =>
        ctx.db.delete(message._id),
      );
      await Promise.all(messageDeletions);

      // Delete chats (references user)
      const chatDeletions = chats.map((chat) => ctx.db.delete(chat._id));
      await Promise.all(chatDeletions);

      // Delete sandboxes (references user)
      const sandboxDeletions = sandboxes.map((sandbox) =>
        ctx.db.delete(sandbox._id),
      );
      await Promise.all(sandboxDeletions);

      // Delete team_members (references user)
      const teamMemberDeletions = teamMembers.map((member) =>
        ctx.db.delete(member._id),
      );
      await Promise.all(teamMemberDeletions);

      // Delete team_invitations (references user email)
      if (teamInvitations.length > 0) {
        const teamInvitationDeletions = teamInvitations.map((invitation) =>
          ctx.db.delete(invitation._id),
        );
        await Promise.all(teamInvitationDeletions);
      }

      // Delete subscriptions (references user)
      const subscriptionDeletions = subscriptions.map((subscription) =>
        ctx.db.delete(subscription._id),
      );
      await Promise.all(subscriptionDeletions);

      // Finally, delete the profile itself
      if (existingProfile) {
        await ctx.db.delete(existingProfile._id);
      }

      return true;
    } catch (error) {
      console.error('Error deleting user profile and data:', error);
      throw new Error(
        `Failed to delete user data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
