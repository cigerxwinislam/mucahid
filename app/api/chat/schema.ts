import { z } from 'zod';
import { PluginID } from '@/types/plugins';
import { VALID_MODEL_IDS } from '@/types/llms';

const imageUrlSchema = z.object({
  url: z.string(),
  isPath: z.boolean(),
});

const contentPartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: imageUrlSchema,
  }),
]);

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(contentPartSchema)]),
  attachments: z.array(z.any()).default([]),
});

const modelParamsSchema = z.object({
  isContinuation: z.boolean(),
  isTerminalContinuation: z.boolean(),
  selectedPlugin: z.nativeEnum(PluginID),
  agentMode: z.enum(['auto-run', 'ask-every-time'] as const),
  confirmTerminalCommand: z.boolean(),
  isTemporaryChat: z.boolean(),
  isRegeneration: z.boolean(),
  editSequenceNumber: z.number().optional(),
});

const chatMetadataSchema = z.object({
  id: z.string().uuid().optional(),
  newChat: z.boolean().optional(),
  retrievedFileItems: z.array(z.any()).default([]),
});

export const postRequestBodySchema = z.object({
  messages: z.array(messageSchema),
  model: z.enum(VALID_MODEL_IDS),
  modelParams: modelParamsSchema,
  chatMetadata: chatMetadataSchema,
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
