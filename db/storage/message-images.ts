import { makeAuthenticatedRequest } from '@/lib/api/convex';
import { convertBlobToBase64 } from '@/lib/blob-to-b64';
import type { MessageImage } from '@/types';
import type { Doc } from '@/convex/_generated/dataModel';

export const uploadImage = async (image: File): Promise<string> => {
  const imageSizeLimit = 5000000; // 5MB

  if (image.size > imageSizeLimit) {
    throw new Error(`Image must be less than ${imageSizeLimit / 1000000}MB`);
  }

  try {
    // Use makeAuthenticatedRequest with file upload support
    // Backend will extract user ID from the authentication token
    const result = await makeAuthenticatedRequest(
      `/api/upload-image`,
      'POST',
      image,
      {
        'Content-Type': image.type,
      },
    );

    if (!result?.success) {
      throw new Error(result?.error || 'Upload failed');
    }

    return result.storageId;
  } catch (error) {
    console.error('Error uploading image to Convex:', error);
    throw error;
  }
};

export const getImageUrl = async (storageId: string): Promise<string> => {
  try {
    // Check if storageId contains "/" which indicates it's a Supabase path with UUIDs
    if (storageId.includes('/')) {
      return '';
    }

    const result = await makeAuthenticatedRequest(
      `/api/get-image-url?storage_id=${encodeURIComponent(storageId)}`,
      'GET',
    );

    return result?.url || '';
  } catch (error) {
    console.error('Error getting image URL from Convex:', error);
    return '';
  }
};

export const processMessageImages = async (
  messages: Doc<'messages'>[],
): Promise<MessageImage[]> => {
  const imagePromises: Promise<MessageImage>[] = messages.flatMap((message) =>
    message.image_paths
      ? message.image_paths.map(async (imagePath) => {
          const url = await getImageUrl(imagePath);

          if (url) {
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const base64 = await convertBlobToBase64(blob);

              const messageImage: MessageImage = {
                messageId: message.id,
                path: imagePath,
                base64,
                url,
                file: null,
              };

              return messageImage;
            } catch (error) {
              console.error('Error fetching image:', error);
              return {
                messageId: message.id,
                path: imagePath,
                base64: '',
                url: url || '',
                file: null,
              } as MessageImage;
            }
          }

          return {
            messageId: message.id,
            path: imagePath,
            base64: '',
            url: url || '',
            file: null,
          } as MessageImage;
        })
      : [],
  );

  return await Promise.all(imagePromises.flat());
};
