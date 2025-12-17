const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

interface UploadProgress {
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

const validateVideoFile = (file: File): File => {
  // Log file details for debugging
  console.log("Initial file details:", {
    type: file.type,
    size: file.size,
    name: file.name,
  });

  // Size check first
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video file size must be less than 500MB.");
  }

  // Handle files with video extensions but incorrect MIME types
  if (
    file.name.toLowerCase().endsWith(".mp4") ||
    file.name.toLowerCase().endsWith(".mov") ||
    file.name.toLowerCase().endsWith(".webm")
  ) {
    // Create a new File with correct MIME type
    const type = file.name.toLowerCase().endsWith(".mp4")
      ? "video/mp4"
      : file.name.toLowerCase().endsWith(".mov")
      ? "video/quicktime"
      : "video/webm";

    const newFile = new File([file], file.name, { type });

    console.log("Corrected file type:", {
      originalType: file.type,
      newType: type,
      size: newFile.size,
      name: newFile.name,
    });

    return newFile;
  }

  // Check MIME type for non-corrected files
  if (!file.type.startsWith("video/")) {
    throw new Error("File is not a video. Please upload a video file.");
  }

  // Format check for non-corrected files
  if (!ALLOWED_VIDEO_FORMATS.includes(file.type)) {
    throw new Error(
      `Unsupported video format: ${file.type}. Please upload MP4, WebM, or MOV files only.`
    );
  }

  return file;
};

const getErrorMessage = (error: any): string => {
  try {
    const parsed = JSON.parse(error.message);
    return parsed.error || error.message;
  } catch {
    return error.message;
  }
};

export const uploadMedia = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    // Validate video files before upload
    if (file.type.startsWith("video/")) {
      validateVideoFile(file);
    }

    let uploadId: string | null = null;
    let offset = 0;
    const totalSize = file.size;

    while (offset < totalSize) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);

      // Create a new File object from the chunk to preserve metadata
      const chunkFile = new File([chunk], file.name, { type: file.type });

      const formData = new FormData();
      formData.append("file", chunkFile);
      formData.append("chunkStart", offset.toString());
      formData.append("totalSize", totalSize.toString());
      if (uploadId) {
        formData.append("uploadId", uploadId);
      }

      const response = await new Promise<{
        url?: string;
        uploadId?: string;
        complete?: boolean;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const chunkProgress = (e.loaded / e.total) * 100;
            const overallProgress =
              ((offset + (e.loaded * CHUNK_SIZE) / e.total) / totalSize) * 100;
            onProgress({
              progress: Math.min(overallProgress, 99), // Cap at 99% until complete
              status: "uploading",
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorResponse.error ||
                    `Upload failed with status ${xhr.status}`
                )
              );
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          onProgress?.({
            progress: (offset / totalSize) * 100,
            status: "error",
            error: "Upload failed",
          });
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          onProgress?.({
            progress: (offset / totalSize) * 100,
            status: "error",
            error: "Upload aborted",
          });
          reject(new Error("Upload aborted"));
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      if (response.complete) {
        onProgress?.({
          progress: 100,
          status: "complete",
        });
        return response.url!;
      }

      if (response.uploadId) {
        uploadId = response.uploadId;
      }

      offset += CHUNK_SIZE;

      // Update progress for chunk completion
      onProgress?.({
        progress: Math.min((offset / totalSize) * 100, 99),
        status: "uploading",
      });
    }

    throw new Error("Upload failed to complete");
  } catch (error) {
    console.error("Error in upload:", error);
    onProgress?.({
      progress: 0,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
};
