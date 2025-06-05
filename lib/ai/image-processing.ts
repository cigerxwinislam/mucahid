import type { BuiltChatMessage } from '@/types/chat-message';
import type { ImageContent } from '@/types/chat-message';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ConvexHttpClient } from 'convex/browser';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Gets URLs for multiple images from Convex storage
 * @param storageIds - Array of storage IDs
 * @returns Promise resolving to map of storage ID to URL
 */
async function getImageUrls(
  storageIds: string[],
): Promise<Map<string, string>> {
  // Return empty map if no storage IDs to process
  if (!storageIds.length) {
    return new Map();
  }

  const urlMap = new Map<string, string>();

  // Process all storage IDs in parallel
  const urlPromises = storageIds.map(async (storageId) => {
    try {
      // Check if storageId contains "/" which indicates it's a Supabase path with UUIDs
      // Skip calling getImageUrlPublic for these cases
      if (storageId.includes('/')) {
        // Don't add to urlMap, effectively filtering out these storage IDs
        return;
      }

      const url = await convex.query(api.fileStorage.getImageUrlPublic, {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        storageId: storageId as Id<'_storage'>,
      });
      if (url) {
        urlMap.set(storageId, url);
      }
    } catch (error) {
      console.error(`Error getting URL for storage ID ${storageId}:`, error);
    }
  });

  await Promise.all(urlPromises);
  return urlMap;
}

/**
 * Processes messages and converts image paths to URLs
 * @param messages - Array of chat messages to process
 * @param selectedModel - The selected model to check if it supports images
 * @returns Promise resolving to processed messages with image URLs or images removed
 */
export async function processMessagesWithImages(
  messages: BuiltChatMessage[],
  selectedModel?: string,
): Promise<BuiltChatMessage[]> {
  // If model doesn't support images, remove them
  if (
    selectedModel === 'deep-research-model' ||
    selectedModel === 'reasoning-model'
  ) {
    return removeImagesFromMessages(messages);
  }

  // Collect all unique storage IDs that need processing
  const storageIdsToProcess = new Set<string>();
  messages.forEach((message) => {
    if (Array.isArray(message.content)) {
      message.content.forEach((item) => {
        if (
          item.type === 'image_url' &&
          'isPath' in item.image_url &&
          item.image_url.isPath
        ) {
          storageIdsToProcess.add(item.image_url.url);
        }
      });
    }
  });

  // If no storage IDs to process, return original messages
  if (storageIdsToProcess.size === 0) {
    return messages;
  }

  // Get URLs for all images from Convex storage
  const imageUrls = await getImageUrls(Array.from(storageIdsToProcess));

  // Process messages using the image URLs directly
  return messages.map((message) => {
    if (Array.isArray(message.content)) {
      const processedContent = message.content.map((item) => {
        if (
          item.type === 'image_url' &&
          'isPath' in item.image_url &&
          item.image_url.isPath
        ) {
          const url = imageUrls.get(item.image_url.url);
          if (url) {
            return {
              type: 'image_url' as const,
              image_url: {
                url: url,
              },
            } as ImageContent;
          }
        }
        return item;
      });
      return { ...message, content: processedContent };
    }
    return message;
  });
}

/**
 * Removes images from messages when the model doesn't support them
 * @param messages - Array of chat messages to process
 * @returns Processed messages with images removed
 */
export function removeImagesFromMessages(
  messages: BuiltChatMessage[],
): BuiltChatMessage[] {
  return messages.map((message) => {
    if (Array.isArray(message.content)) {
      // Filter out image content and keep only text content
      const processedContent = message.content.filter(
        (item) => item.type !== 'image_url',
      );
      return { ...message, content: processedContent };
    }
    return message;
  });
}
