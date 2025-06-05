import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  profiles: defineTable({
    user_id: v.string(),
    image_url: v.optional(v.string()),
    profile_context: v.optional(v.string()),
  }).index('by_user_id', ['user_id']),

  sandboxes: defineTable({
    user_id: v.string(),
    sandbox_id: v.string(),
    template: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('pausing'),
      v.literal('paused'),
    ),
    updated_at: v.number(),
  })
    .index('by_user_and_template', ['user_id', 'template'])
    .index('by_sandbox_id', ['sandbox_id']),

  feedback: defineTable({
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
  })
    .index('by_message_id', ['message_id'])
    .index('by_chat_and_sequence', ['chat_id', 'sequence_number']),

  chats: defineTable({
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
  })
    .index('by_chat_id', ['id'])
    .index('by_user_id', ['user_id'])
    .index('by_user_and_updated', ['user_id', 'updated_at']),

  messages: defineTable({
    id: v.string(),
    chat_id: v.string(),
    user_id: v.string(),
    content: v.string(),
    image_paths: v.array(v.string()),
    model: v.string(),
    plugin: v.optional(v.string()),
    role: v.string(),
    sequence_number: v.number(),
    thinking_content: v.optional(v.string()),
    thinking_elapsed_secs: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    attachments: v.optional(v.array(v.any())),
    citations: v.array(v.string()),
  })
    .index('by_chat_id', ['chat_id'])
    .index('by_chat_and_sequence', ['chat_id', 'sequence_number'])
    .index('by_message_id', ['id'])
    .index('by_user_id', ['user_id']),

  files: defineTable({
    user_id: v.string(),
    file_path: v.string(),
    name: v.string(),
    size: v.number(),
    tokens: v.number(),
    type: v.string(),
    message_id: v.optional(v.string()),
    chat_id: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index('by_message_id', ['message_id'])
    .index('by_chat_id', ['chat_id'])
    .index('by_user_id', ['user_id']),

  file_items: defineTable({
    file_id: v.id('files'),
    user_id: v.string(),
    content: v.string(),
    tokens: v.number(),
    name: v.optional(v.string()),
    sequence_number: v.number(),
    updated_at: v.optional(v.number()),
    message_id: v.optional(v.string()),
    chat_id: v.optional(v.string()),
  })
    .index('by_file_id', ['file_id'])
    .index('by_message_id', ['message_id'])
    .index('by_chat_id', ['chat_id']),

  subscriptions: defineTable({
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
  })
    .index('by_subscription_id', ['subscription_id'])
    .index('by_user_id', ['user_id'])
    .index('by_user_and_status', ['user_id', 'status'])
    .index('by_team_id', ['team_id']),

  teams: defineTable({
    id: v.string(),
    name: v.string(),
  }),

  team_invitations: defineTable({
    id: v.string(),
    team_id: v.string(),
    inviter_id: v.string(),
    invitee_email: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
    ),
    updated_at: v.optional(v.number()),
  })
    .index('by_team_id', ['team_id'])
    .index('by_invitee_email', ['invitee_email'])
    .index('by_team_and_email', ['team_id', 'invitee_email']),

  team_members: defineTable({
    id: v.string(),
    team_id: v.string(),
    user_id: v.string(),
    invitation_id: v.optional(v.string()),
    role: v.union(v.literal('member'), v.literal('owner')),
  })
    .index('by_user_id', ['user_id'])
    .index('by_team_and_user', ['team_id', 'user_id'])
    .index('by_invitation_id', ['invitation_id']),
});
