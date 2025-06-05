import type { Sandbox } from '@e2b/code-interpreter';
import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface FileUploadResult {
  success: boolean;
  name: string;
  path: string;
  error?: string;
}

interface BatchFileUploadResult {
  success: boolean;
  uploadedFiles: FileUploadResult[];
  limitExceeded: boolean;
}

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not defined');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function uploadFileToSandbox(
  fileId: Id<'files'>,
  sandbox: Sandbox,
  dataStream: any,
): Promise<FileUploadResult> {
  let name = fileId.toString();
  try {
    const { content, name: fileName } =
      await getFileContentFromSupabase(fileId);
    name = fileName;
    const sandboxPath = `/home/user/${name}`;

    await sandbox.files.write(sandboxPath, content);

    dataStream.writeData({
      type: 'text-delta',
      content: `📝 Uploaded ${name} to /home/user/\n`,
    });

    return {
      success: true,
      name,
      path: sandboxPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ File upload failed:', errorMessage);

    dataStream.writeData({
      type: 'text-delta',
      content: `⚠️ Failed to upload ${name}: ${errorMessage}\n`,
    });

    return {
      success: false,
      name,
      path: '',
      error: errorMessage,
    };
  }
}

async function getFileContentFromSupabase(fileId: Id<'files'>) {
  const supabaseAdmin = createSupabaseAdminClient();

  // Get file metadata from Convex
  const fileData = await convex.query(api.files.getFile, {
    fileId,
  });

  if (!fileData) {
    console.error('❌ Failed to get file metadata: File not found');
    throw new Error('Failed to get file metadata: File not found');
  }

  // Then get actual file content from storage
  const { data: fileContent, error: storageError } = await supabaseAdmin.storage
    .from('files')
    .download(fileData.file_path);

  if (storageError) {
    console.error('❌ Failed to download file:', storageError.message);
    throw new Error(`Failed to download file: ${storageError.message}`);
  }

  const content = await fileContent.text();

  return {
    content,
    name: fileData.name,
  };
}

export async function uploadFilesToSandbox(
  files: { fileId: Id<'files'> }[],
  sandbox: Sandbox,
  dataStream: any,
): Promise<BatchFileUploadResult> {
  let filesToProcess = files;

  if (files.length > 1) {
    dataStream.writeData({
      type: 'text-delta',
      content:
        '⚠️ Warning: Maximum 3 files can be uploaded at once. Only the first 3 files will be processed.\n',
    });
    filesToProcess = files.slice(0, 3);
  }

  const results = [];
  for (const fileRequest of filesToProcess) {
    const result = await uploadFileToSandbox(
      fileRequest.fileId,
      sandbox,
      dataStream,
    );
    results.push(result);
  }

  return {
    success: results.every((r) => r.success),
    uploadedFiles: results,
    limitExceeded: files.length > 3,
  };
}
