import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import type { BuiltChatMessage } from '@/types/chat-message';
import type { MessageContent } from '@/types/chat-message';
import type { TextPart, FilePart } from 'ai';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export function buildDocumentsText(fileItems: Doc<'file_items'>[]) {
  const fileGroups: Record<
    string,
    { id: string; name: string; content: string[] }
  > = fileItems.reduce(
    (
      acc: Record<string, { id: string; name: string; content: string[] }>,
      item: Doc<'file_items'>,
    ) => {
      if (!acc[item.file_id]) {
        acc[item.file_id] = {
          id: item.file_id,
          name: item.name || 'unnamed file',
          content: [],
        };
      }
      acc[item.file_id].content.push(item.content);
      return acc;
    },
    {},
  );

  const documents = Object.values(fileGroups)
    .map((file: any) => {
      return `<document id="${file.id}">
<source>${file.name}</source>
<document_content>${file.content.join('\n\n')}</document_content>
</document>`;
    })
    .join('\n\n');

  return `<documents>\n${documents}\n</documents>`;
}

/**
 * Process PDF file items directly to get file contents
 * @param supabaseAdmin - The Supabase admin client
 * @param fileItem - The file item to process
 * @param userId - User ID for authorization
 * @returns PDF file object or null
 */
export async function processPdfFileItem(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  fileItem: Doc<'file_items'>,
  userId: string,
) {
  try {
    // Check if file might be a PDF based on name
    if (!fileItem.name || !fileItem.name.toLowerCase().endsWith('.pdf')) {
      return null;
    }

    // Get the file metadata from Convex
    const fileMetadata = await convex.query(api.files.getFile, {
      fileId: fileItem.file_id,
    });

    if (!fileMetadata) {
      return null;
    }

    // Check authorization
    if (fileMetadata.user_id !== userId) {
      return null;
    }

    // Check if it's a PDF
    if (
      fileMetadata.type !== 'application/pdf' &&
      !fileMetadata.name.toLowerCase().endsWith('.pdf')
    ) {
      return null;
    }

    // Download the file from Supabase storage
    const { data: file, error: fileError } = await supabaseAdmin.storage
      .from('files')
      .download(fileMetadata.file_path);

    if (fileError || !file) {
      return null;
    }

    // Convert to buffer for PDF handling
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      type: 'file' as const,
      data: buffer,
      mimeType: 'application/pdf',
      filename: fileMetadata.name,
    };
  } catch (error) {
    console.error('Error processing PDF file item:', error);
    return null;
  }
}

/**
 * Creates an array of file objects with paths and content for pentest agent
 * @param fileItems - Array of file items to process
 * @returns Array of file objects with paths and content
 */
export function createPentestFileArray(
  localPath: string,
  fileItems: Doc<'file_items'>[],
) {
  return fileItems.map((fileItem) => ({
    path: `${localPath}/${fileItem.name}`,
    data: fileItem.content,
  }));
}

/**
 * Processes message content and attachments, handling different attachment types appropriately
 * @param messages - The chat messages to process
 * @param userId - The user ID for authorization
 * @returns The processed messages with attachments included and pentest files array if applicable
 */
export async function processMessageContentWithAttachments(
  messages: BuiltChatMessage[],
  userId: string,
  isReasoning: boolean,
  isPentestAgent = false,
): Promise<{
  processedMessages: BuiltChatMessage[];
  pentestFiles?: Array<{ path: string; data: string }>;
}> {
  if (!messages.length) return { processedMessages: messages };

  // Create a copy to avoid mutating the original
  let processedMessages = [...messages];
  let pentestFiles: Array<{ path: string; data: string }> | undefined;
  const localPath = '/mnt/data';

  try {
    // Create admin client to access database
    const supabaseAdmin = createSupabaseAdminClient();

    // Collect all file IDs from user messages only
    const allFileIds = processedMessages
      .filter((m) => m.role === 'user') // Only process user messages
      .flatMap((m) => (m.attachments ?? []).map((a) => a.file_id))
      .filter(Boolean);

    // Make a single batch query for all file items
    const allFileItems = await convex.query(
      api.file_items.getAllFileItemsByFileIds,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        fileIds: allFileIds,
      },
    );

    // If this is a pentest agent, create the file array
    if (isPentestAgent && allFileItems) {
      pentestFiles = createPentestFileArray(localPath, allFileItems);
    }

    // Process each message
    for (const message of processedMessages) {
      // Only process attachments for user messages
      if (
        message.role === 'user' &&
        message.attachments &&
        Array.isArray(message.attachments)
      ) {
        // Filter file items for this specific message
        const fileItems =
          allFileItems?.filter((fi) =>
            (message.attachments ?? []).some((a) => a.file_id === fi.file_id),
          ) ?? [];

        if (fileItems.length > 0) {
          // Process files in the order they appear in attachments
          const processedContent: MessageContent[] = [];
          let hasPdfAttachments = false;

          // First add the original content if it's a string
          if (typeof message.content === 'string') {
            processedContent.push({
              type: 'text',
              text: message.content,
            } as TextPart);
          } else if (Array.isArray(message.content)) {
            processedContent.push(...message.content);
          }

          // Process each attachment in order
          for (const attachment of message.attachments) {
            if (!attachment.file_id) continue;

            const fileItem = fileItems.find(
              (item) => item.file_id === attachment.file_id,
            );
            if (!fileItem) continue;

            // If isReasoning is true, use buildDocumentsText for all files including PDFs
            if (isReasoning) {
              const documentsText = buildDocumentsText([fileItem]);
              processedContent.push({
                type: 'text',
                text: documentsText,
              } as TextPart);
            } else {
              // Check if it's a PDF
              const pdfFile = await processPdfFileItem(
                supabaseAdmin,
                fileItem,
                userId,
              );
              if (pdfFile) {
                // Always send PDFs as files
                processedContent.push(pdfFile as FilePart);
                hasPdfAttachments = true;
              } else if (isPentestAgent) {
                // For pentest agent, add XML-like attachment reference
                const attachmentRef = `<attachment filename="${fileItem.name}" local_path="${localPath}/${fileItem.name}" />`;
                processedContent.push({
                  type: 'text',
                  text: attachmentRef,
                } as TextPart);
              } else if (!hasPdfAttachments) {
                // Normal case: add document text
                const documentsText = buildDocumentsText([fileItem]);
                processedContent.push({
                  type: 'text',
                  text: documentsText,
                } as TextPart);
              }
            }
          }

          // Update the message content with the processed content
          message.content = processedContent;
        }
      }
    }

    // Remove attachments from all messages after processing
    processedMessages = processedMessages.map(
      ({ attachments, ...messageWithoutAttachments }) =>
        messageWithoutAttachments,
    );

    return { processedMessages, pentestFiles };
  } catch (error) {
    console.error('Error processing message attachments:', error);
  }

  return { processedMessages };
}

/**
 * Removes PDF file content from message arrays
 * Filters out any objects that have type 'file' and mimeType 'application/pdf'
 */
export function removePdfContentFromMessages(messages: any[]) {
  return messages.map((message) => {
    // If content is an array, filter out PDF file objects
    if (Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.filter(
          (item: any) =>
            !(item.type === 'file' && item.mimeType === 'application/pdf'),
        ),
      };
    }
    // Otherwise leave the message as is
    return message;
  });
}
