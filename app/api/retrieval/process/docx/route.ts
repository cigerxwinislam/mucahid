import { processDocX } from '@/lib/retrieval/processing';
import { getServerUser } from '@/lib/server/server-chat-helpers';
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
  const json = await req.json();
  const { text, fileId, fileExtension } = json as {
    text: string;
    fileId: Id<'files'>;
    fileExtension: string;
  };

  try {
    const user = await getServerUser();

    let chunks: FileItemChunk[] = [];

    switch (fileExtension) {
      case 'docx':
        chunks = await processDocX(text);
        break;
      default:
        return new NextResponse('Unsupported file type', {
          status: 400,
        });
    }

    const file_items = chunks.map((chunk) => ({
      file_id: fileId,
      user_id: user.id,
      sequence_number: 0,
      content: chunk.content,
      tokens: chunk.tokens,
    }));

    const upsertResult = await convex.mutation(api.file_items.upsertFileItems, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      fileItems: file_items,
    });

    if (!upsertResult.success) {
      throw new Error(upsertResult.error || 'Failed to upsert file items');
    }

    const totalTokens = file_items.reduce((acc, item) => acc + item.tokens, 0);

    await convex.mutation(api.files.updateFile, {
      fileId,
      fileData: {
        tokens: totalTokens,
      },
    });

    return new NextResponse('Embed Successful', {
      status: 200,
    });
  } catch (error: any) {
    console.error(error);
    const errorMessage = error.error?.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}
