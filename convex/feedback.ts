import { mutation, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

export const internalGetFeedbackByChatId = internalQuery({
  args: {
    chat_id: v.string(),
    limit: v.optional(v.number()),
    last_sequence_number: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      message_id: v.string(),
      user_id: v.string(),
      chat_id: v.string(),
      feedback: v.union(v.literal('good'), v.literal('bad')),
      reason: v.optional(v.string()),
      detailed_feedback: v.optional(v.string()),
      model: v.string(),
      updated_at: v.number(),
      sequence_number: v.number(),
      allow_email: v.optional(v.boolean()),
      allow_sharing: v.optional(v.boolean()),
      has_files: v.boolean(),
      plugin: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('feedback')
      .withIndex('by_chat_and_sequence', (q) =>
        q
          .eq('chat_id', args.chat_id)
          .lt(
            'sequence_number',
            args.last_sequence_number ?? Number.MAX_SAFE_INTEGER,
          ),
      )
      .order('desc');

    const feedbackRecords =
      args.limit !== undefined
        ? await query.take(args.limit)
        : await query.collect();

    // Return feedback without system fields
    return feedbackRecords.map((feedback) => {
      const { _id, _creationTime, ...feedbackWithoutSystemFields } = feedback;
      return feedbackWithoutSystemFields;
    });
  },
});

export const saveFeedback = mutation({
  args: {
    message_id: v.string(),
    user_id: v.string(),
    chat_id: v.string(),
    feedback: v.union(v.literal('good'), v.literal('bad')),
    reason: v.optional(v.string()),
    detailed_feedback: v.optional(v.string()),
    model: v.string(),
    sequence_number: v.number(),
    allow_email: v.optional(v.boolean()),
    allow_sharing: v.optional(v.boolean()),
    has_files: v.boolean(),
    plugin: v.string(),
    updated_at: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if feedback already exists for this message
    const existingFeedback = await ctx.db
      .query('feedback')
      .withIndex('by_message_id', (q) => q.eq('message_id', args.message_id))
      .first();

    const feedbackData = {
      ...args,
    };

    if (existingFeedback) {
      // Update existing feedback
      await ctx.db.patch(existingFeedback._id, feedbackData);
      return existingFeedback._id;
    } else {
      // Create new feedback
      return await ctx.db.insert('feedback', feedbackData);
    }
  },
});

export const deleteOldFeedback = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Calculate timestamp for 30 days ago
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Query for old feedback entries
    const oldFeedback = await ctx.db
      .query('feedback')
      .filter((q) => q.lt(q.field('updated_at'), thirtyDaysAgo))
      .collect();

    console.log(`Found ${oldFeedback.length} old feedback entries to delete`);

    // Delete each old feedback entry
    for (const feedback of oldFeedback) {
      await ctx.db.delete(feedback._id);
    }

    console.log(
      `Successfully deleted ${oldFeedback.length} old feedback entries`,
    );
    return oldFeedback.length; // Return number of deleted entries
  },
});
