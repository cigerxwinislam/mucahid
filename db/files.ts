import { ConvexClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { TablesInsert, TablesUpdate } from '@/supabase/types';
import mammoth from 'mammoth';
import { toast } from 'sonner';
import { uploadFile } from '@/db/storage/files';
import type { Id } from '@/convex/_generated/dataModel';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not defined');
}

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const getFileById = async (fileId: Id<'files'>) => {
  const file = await convex.query(api.files.getFile, { fileId });

  if (!file) {
    throw new Error('File not found');
  }

  return file;
};

export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  const fileExtension = file.name.split('.').pop();

  if (fileExtension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({
      arrayBuffer,
    });

    return createDocXFile(result.value, file, fileRecord);
  } else {
    return createFile(file, fileRecord);
  }
};

// Base function for common file creation logic
const createBaseFile = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
  processFile: (fileId: Id<'files'>) => Promise<void>,
) => {
  const filesCounts = await convex.query(api.files.getAllFilesCount, {
    userId: fileRecord.user_id,
  });
  const maxFiles = Number.parseInt(
    process.env.NEXT_PUBLIC_RATELIMITER_LIMIT_FILES || '100',
  );
  if (filesCounts >= maxFiles) return false;

  const sizeLimitMB = Number.parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT_MB || String(30),
  );
  const MB_TO_BYTES = (mb: number) => mb * 1024 * 1024;
  const SIZE_LIMIT = MB_TO_BYTES(sizeLimitMB);
  if (file.size > SIZE_LIMIT) {
    throw new Error(`File must be less than ${sizeLimitMB}MB`);
  }

  const fileData = {
    user_id: fileRecord.user_id,
    file_path: fileRecord.file_path,
    name: fileRecord.name,
    size: fileRecord.size,
    tokens: fileRecord.tokens,
    type: fileRecord.type,
  };

  const createdFile = await convex.mutation(api.files.createFile, {
    fileData,
  });

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name,
  });

  await updateFile(createdFile._id, {
    file_path: filePath,
  });

  try {
    await processFile(createdFile._id);
  } catch (error) {
    await deleteFile(createdFile._id);
    throw error;
  }

  const fetchedFile = await getFileById(createdFile._id);
  await getFileItemsByFileId(createdFile._id);

  return fetchedFile;
};

// For non-docx files
export const createFile = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  let validFilename = fileRecord.name
    .replace(/[^a-z0-9.]/gi, '_')
    .toLowerCase();
  const extension = validFilename.split('.').pop();
  const baseName = validFilename.substring(0, validFilename.lastIndexOf('.'));
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1;
  if (baseName.length > maxBaseNameLength) {
    validFilename = `${baseName.substring(0, maxBaseNameLength)}.${extension}`;
  }
  fileRecord.name = validFilename;

  return createBaseFile(file, fileRecord, async (fileId) => {
    const formData = new FormData();
    formData.append('file_id', fileId);

    const response = await fetch('/api/retrieval/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const jsonText = await response.text();
      const json = JSON.parse(jsonText);
      console.error(
        `Error processing file:${fileId}, status:${response.status}, response:${json.message}`,
      );
      throw new Error(
        `Failed to process file (${fileRecord.name}): ${json.message}`,
      );
    }
  });
};

// Handle docx files
export const createDocXFile = async (
  text: string,
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  return createBaseFile(file, fileRecord, async (fileId) => {
    const response = await fetch('/api/retrieval/process/docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        fileId: fileId,
        fileExtension: 'docx',
      }),
    });

    if (!response.ok) {
      const jsonText = await response.text();
      const json = JSON.parse(jsonText);
      console.error(
        `Error processing file:${fileId}, status:${response.status}, response:${json.message}`,
      );
      toast.error(`Failed to process file. Reason:${json.message}`, {
        duration: 10000,
      });
      throw new Error(`Failed to process file: ${json.message}`);
    }
  });
};

export const updateFile = async (
  fileId: Id<'files'>,
  file: TablesUpdate<'files'>,
) => {
  const fileData = {
    file_path: file.file_path,
    name: file.name,
    size: file.size,
    tokens: file.tokens,
    type: file.type,
    message_id: file.message_id || undefined,
    chat_id: file.chat_id || undefined,
  };

  const updatedFile = await convex.mutation(api.files.updateFile, {
    fileId,
    fileData,
  });

  return updatedFile;
};

export const deleteFile = async (fileId: Id<'files'>) => {
  const success = await convex.mutation(api.files.deleteFile, {
    fileId,
  });

  if (!success) {
    throw new Error('Failed to delete file');
  }

  return true;
};

export const getFileItemsByFileId = async (fileId: Id<'files'>) => {
  const fileItems = await convex.query(api.file_items.getFileItemsByFileId, {
    fileId: fileId,
  });

  return fileItems;
};
