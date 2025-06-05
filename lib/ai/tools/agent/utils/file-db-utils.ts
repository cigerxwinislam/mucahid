import type { FileAttachment } from '@/types';
import { createAdminFile } from '@/db/storage/admin-files';
import type { SandboxManager } from '../types';

export const saveFileToDatabase = async (
  filePath: string,
  content: string,
  userId: string,
  dataStream: any,
  append?: boolean,
): Promise<FileAttachment | string> => {
  // Extract filename from path
  const fileName = filePath.split('/').pop() || 'untitled.txt';

  // Create a File object from the content
  const file = new File([content], fileName, { type: 'text/plain' });

  // Create file record
  const fileRecord = {
    name: fileName,
    user_id: userId,
    file_path: '',
    size: content.length,
    tokens: 0,
    type: 'text/plain',
  };

  try {
    // Use createAdminFile to handle the file upload and processing
    const createdFile = await createAdminFile(file, fileRecord, append);

    if (!createdFile) {
      dataStream.writeData({
        type: 'text-delta',
        content: `⚠️ Failed to attach file: ${fileName}\n`,
      });
      return `Failed to attach file: ${fileName}`;
    }

    const fileData: FileAttachment = {
      fileName: createdFile.name,
      id: createdFile._id,
      mimeType: createdFile.type,
      type: 'text',
      url: createdFile.file_path,
    };

    // Send file metadata as a separate attachment
    if (!append) {
      dataStream.writeData({
        type: 'file-attachment',
        content: [fileData],
      });
    }

    return fileData;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('File must be less than')
    ) {
      dataStream.writeData({
        type: 'text-delta',
        content: `⚠️ File "${fileName}" is too large to be attached (must be less than 30MB)\n`,
      });
    } else {
      console.error('Error creating file:', error);
      dataStream.writeData({
        type: 'text-delta',
        content: `⚠️ Failed to attach file: ${fileName}\n`,
      });
    }
    return `Failed to attach file: ${fileName}`;
  }
};

/**
 * Handles file attachments for message tools
 */
export const handleMessageAttachments = async ({
  attachments,
  userID,
  dataStream,
  sandboxManager,
}: {
  attachments: string | string[];
  userID: string;
  dataStream: any;
  sandboxManager: SandboxManager;
}): Promise<string | null> => {
  if (!attachments) return null;

  try {
    // Get sandbox from manager
    const { sandbox: currentSandbox } = await sandboxManager.getSandbox();

    const filePaths = Array.isArray(attachments) ? attachments : [attachments];
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const content = await currentSandbox.files.read(filePath);
        const result = await saveFileToDatabase(
          filePath,
          content,
          userID,
          dataStream,
        );

        if (typeof result === 'string') {
          errors.push(`Error processing ${filePath}: ${result}`);
        }
      } catch (error) {
        errors.push(
          `Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (errors.length > 0) {
      return errors.join('\n');
    }

    return null;
  } catch (error) {
    return `Error handling attachments: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};
