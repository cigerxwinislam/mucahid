import type { Json } from '@/supabase/types';
import type { FileAttachment } from '@/types';

export const convertToJsonAttachments = (
  attachments: FileAttachment[],
): Json[] => {
  return attachments.map((attachment) => ({
    fileName: attachment.fileName,
    id: attachment.id,
    mimeType: attachment.mimeType,
    type: attachment.type,
    url: attachment.url,
  }));
};
