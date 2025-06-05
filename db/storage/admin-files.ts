import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import type { TablesInsert } from '@/supabase/types';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not defined');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const uploadAdminFile = async (
  file: File,
  payload: {
    name: string;
    user_id: string;
    file_id: string;
    supabaseAdmin: any;
  },
) => {
  const sizeLimitMB = Number.parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT_MB || String(30),
  );
  const MB_TO_BYTES = (mb: number) => mb * 1024 * 1024;
  const SIZE_LIMIT = MB_TO_BYTES(sizeLimitMB);

  if (file.size > SIZE_LIMIT) {
    throw new Error(`File must be less than ${sizeLimitMB}MB`);
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString('base64')}`;

  const { error } = await payload.supabaseAdmin.storage
    .from('files')
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }

  return filePath;
};

// Helper function to convert Supabase file record to Convex format
const convertToConvexFile = (fileRecord: TablesInsert<'files'>) => {
  return {
    user_id: fileRecord.user_id,
    file_path: fileRecord.file_path,
    name: fileRecord.name,
    size: fileRecord.size,
    tokens: fileRecord.tokens || 0,
    type: fileRecord.type,
  };
};

export const createAdminFile = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
  append?: boolean,
) => {
  const supabaseAdmin = createSupabaseAdminClient();

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

  let createdFile;

  // If append is true, check if a file already exists at the same location
  if (append) {
    const existingFile = await convex.query(api.files.getFile, {
      userId: fileRecord.user_id,
      fileName: validFilename,
    });

    if (existingFile) {
      // Update the existing file
      createdFile = await convex.mutation(api.files.updateFile, {
        fileId: existingFile._id,
        fileData: {
          size: file.size,
        },
      });
    }
  }

  // If no existing file was found or append is false, create a new file
  if (!createdFile) {
    createdFile = await convex.mutation(api.files.createFile, {
      fileData: {
        ...convertToConvexFile(fileRecord),
        size: file.size,
      },
    });
  }

  // Upload file to storage using admin client
  const filePath = await uploadAdminFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile._id,
    supabaseAdmin,
  });

  const finalFile = await convex.mutation(api.files.updateFile, {
    fileId: createdFile._id,
    fileData: {
      file_path: filePath,
    },
  });

  return finalFile;
};
