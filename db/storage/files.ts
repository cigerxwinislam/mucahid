import { supabase } from '@/lib/supabase/browser-client';
import JSZip from 'jszip';

export const uploadFile = async (
  file: File,
  payload: {
    name: string;
    user_id: string;
    file_id: string;
  },
) => {
  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString('base64')}`;

  const { error } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    throw new Error('Error uploading file');
  }

  return filePath;
};

export const getFileFromStorage = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(filePath, 60 * 60 * 24); // 24hrs

  if (error) {
    throw new Error('Error downloading file');
  }

  return data.signedUrl;
};

/**
 * Downloads a single file from storage and triggers browser download
 */
export const downloadFile = async (fileUrl: string, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('files')
      .download(fileUrl);

    if (error) {
      throw new Error('Error downloading file');
    }

    // Create blob and download link
    const blob = new Blob([await data.arrayBuffer()]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

/**
 * Downloads multiple files in sequence
 */
export const downloadMultipleFiles = async (
  files: Array<{ url: string; fileName: string }>,
  onProgress?: (current: number, total: number) => void,
) => {
  if (files.length === 0) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  // Process each file sequentially
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await downloadFile(file.url, file.fileName);
      successCount++;

      // Report progress
      if (onProgress) {
        onProgress(i + 1, files.length);
      }

      // Small delay to prevent browser throttling
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      failedCount++;
      console.error(`Failed to download ${file.fileName}:`, error);
    }
  }

  return {
    success: successCount,
    failed: failedCount,
  };
};

/**
 * Downloads multiple files as a single ZIP archive
 */
export const downloadFilesAsZip = async (
  files: Array<{ url: string; fileName: string }>,
  zipFileName = 'download.zip',
  onProgress?: (current: number, total: number) => void,
) => {
  if (files.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const zip = new JSZip();
    let successCount = 0;
    let failedCount = 0;

    // Add each file to the ZIP
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Report progress on file fetching
        if (onProgress) {
          onProgress(i, files.length * 2); // First half of progress is fetching
        }

        const { data, error } = await supabase.storage
          .from('files')
          .download(file.url);

        if (error) {
          throw error;
        }

        // Add file to zip
        const arrayBuffer = await data.arrayBuffer();
        zip.file(file.fileName, arrayBuffer);
        successCount++;
      } catch (error) {
        console.error(`Failed to add ${file.fileName} to ZIP:`, error);
        failedCount++;
      }
    }

    // Generate the ZIP file
    if (onProgress) {
      onProgress(files.length, files.length * 2); // Mark fetching as complete
    }

    let lastProgress = 0;
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        // Progress callback for zip generation
        if (onProgress) {
          const zipProgress = metadata.percent / 100;
          const overallProgress = files.length + files.length * zipProgress;
          const currentProgress = Math.floor(overallProgress);

          // Only update if progress changed to avoid too many updates
          if (currentProgress > lastProgress) {
            lastProgress = currentProgress;
            onProgress(currentProgress, files.length * 2);
          }
        }
      },
    );

    // Download the ZIP file
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (onProgress) {
      onProgress(files.length * 2, files.length * 2); // Mark as complete
    }

    return {
      success: successCount,
      failed: failedCount,
      zipCreated: true,
    };
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
};
