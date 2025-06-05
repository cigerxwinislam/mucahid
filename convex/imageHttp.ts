import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createResponse,
  createErrorResponse,
  validateAuthWithUser,
  getUrlParams,
} from './httpUtils';
import { Id } from './_generated/dataModel';

/**
 * HTTP action to upload images to Convex storage
 */
export const uploadImageHttp = httpAction(async (ctx, request) => {
  // Validate authentication with user verification
  const authResult = await validateAuthWithUser(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error || 'Authentication failed',
      401,
    );
  }

  try {
    // Store the image file
    const blob = await request.blob();

    // Validate file size (5MB limit)
    const imageSizeLimit = 5000000; // 5MB
    if (blob.size > imageSizeLimit) {
      return createErrorResponse(
        `Image must be less than ${imageSizeLimit / 1000000}MB`,
        400,
      );
    }

    const storageId = await ctx.storage.store(blob);

    return createResponse(
      {
        success: true,
        storageId,
      },
      200,
    );
  } catch (error) {
    console.error('[UPLOAD_IMAGE] Error uploading image:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createErrorResponse('Internal server error', 500);
  }
});

/**
 * HTTP action to get image URLs from Convex storage
 */
export const getImageUrlHttp = httpAction(async (ctx, request) => {
  // Validate authentication with user verification
  const authResult = await validateAuthWithUser(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error || 'Authentication failed',
      401,
    );
  }

  try {
    // Get parameters from URL
    const params = getUrlParams(request, ['storage_id']);
    const { storage_id: storageId } = params;

    if (!storageId) {
      return createErrorResponse('Missing storage_id parameter', 400);
    }

    // Get image URL from storage
    const url = await ctx.runQuery(internal.fileStorage.getImageUrl, {
      storageId: storageId as Id<'_storage'>,
    });

    if (!url) {
      return createErrorResponse('Image not found', 404);
    }

    return createResponse({ url }, 200);
  } catch (error) {
    console.error('Error getting image URL:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
