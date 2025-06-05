import {
  processCSV,
  processJSON,
  processMarkdown,
  processPdf,
  processTxt,
  convert,
  FILE_CONTENT_TOKEN_LIMIT,
} from '@/lib/retrieval/processing';
import { getServerUser } from '@/lib/server/server-chat-helpers';
import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import type { FileItemChunk } from '@/types';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const user = await getServerUser();
    const formData = await req.formData();
    const file_id = formData.get('file_id') as Id<'files'>;

    const fileMetadata = await convex.query(api.files.getFile, {
      fileId: file_id,
    });

    if (!fileMetadata) {
      throw new Error('File not found');
    }

    if (fileMetadata.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const { data: file, error: fileError } = await supabaseAdmin.storage
      .from('files')
      .download(fileMetadata.file_path);

    if (fileError)
      throw new Error(`Failed to retrieve file: ${fileError.message}`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([fileBuffer]);
    const fileExtension = fileMetadata.name.split('.').pop()?.toLowerCase();

    let chunks: FileItemChunk[] = [];

    switch (fileExtension) {
      case 'csv':
        chunks = await processCSV(blob);
        break;
      case 'json':
        chunks = await processJSON(blob);
        break;
      case 'md':
        chunks = await processMarkdown(blob);
        break;
      case 'pdf':
        chunks = await processPdf(blob);
        break;
      case 'txt':
        chunks = await processTxt(blob);
        break;
      default: {
        const cleanText = await convert(blob);
        chunks = await processTxt(new Blob([cleanText]));
        break;
      }
    }

    if (fileExtension !== 'pdf') {
      chunks = chunks.filter((chunk) => chunk.content.trim() !== '');
    }

    if (chunks.length === 0 && fileExtension !== 'pdf') {
      throw new Error('Empty file. Please check the file format and content.');
    }

    const totalTokens = chunks.reduce((acc, chunk) => acc + chunk.tokens, 0);
    const limit = FILE_CONTENT_TOKEN_LIMIT;
    if (totalTokens > limit) {
      throw new Error(`File content exceeds token limit of ${limit}`);
    }

    const file_items = chunks.map((chunk) => ({
      file_id,
      user_id: user.id,
      sequence_number: 0,
      content: chunk.content,
      tokens: chunk.tokens,
      name: fileMetadata.name,
    }));

    const upsertResult = await convex.mutation(api.file_items.upsertFileItems, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      fileItems: file_items,
    });

    if (!upsertResult.success) {
      throw new Error(upsertResult.error || 'Failed to upsert file items');
    }

    await convex.mutation(api.files.updateFile, {
      fileId: file_id,
      fileData: {
        tokens: totalTokens,
      },
    });

    return new NextResponse('File processing successful', {
      status: 200,
    });
  } catch (error: any) {
    // Only log stack trace for unexpected errors
    const knownErrors = ['Empty file', 'exceeds token limit'];

    if (
      !knownErrors.some((knownError) => error.message?.includes(knownError))
    ) {
      console.error(`Error in retrieval/process: ${error.stack}`);
    }

    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}
