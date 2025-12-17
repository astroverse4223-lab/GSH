const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for large videos

export interface VideoUploadProgress {
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export interface VideoUploadOptions {
  onProgress?: (progress: VideoUploadProgress) => void;
  maxRetries?: number;
}

export const uploadVideo = async (
  file: File,
  options: VideoUploadOptions = {}
): Promise<string> => {
  const { onProgress, maxRetries = 3 } = options;

  try {
    // Validate video file
    if (!file.type.startsWith("video/")) {
      throw new Error("File must be a video");
    }

    onProgress?.({
      progress: 0,
      status: "uploading",
    });

    // For smaller files, upload directly
    if (file.size <= CHUNK_SIZE) {
      return await uploadSingleVideo(file, onProgress);
    }

    // For larger files, use chunked upload
    return await uploadChunkedVideo(file, onProgress, maxRetries);
  } catch (error) {
    console.error("Error in video upload:", error);
    onProgress?.({
      progress: 0,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
};

// Upload video in a single request (for smaller files)
const uploadSingleVideo = async (
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("originalType", file.type);
  formData.append("fileExtension", file.name.split(".").pop() || "");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress({
          progress: Math.min(progress, 99), // Cap at 99% until complete
          status: "uploading",
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onProgress?.({
            progress: 100,
            status: "complete",
          });
          resolve(response.url);
        } catch (error) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(
            new Error(
              errorResponse.error || `Upload failed with status ${xhr.status}`
            )
          );
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("POST", "/api/upload/video");
    xhr.send(formData);
  });
};

// Upload large video files in chunks
const uploadChunkedVideo = async (
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void,
  maxRetries: number = 3
): Promise<string> => {
  let offset = 0;
  const totalSize = file.size;
  let retryCount = 0;

  while (offset < totalSize && retryCount < maxRetries) {
    try {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("chunkStart", offset.toString());
      formData.append("totalSize", totalSize.toString());
      formData.append("fileName", file.name);
      formData.append("originalType", file.type); // Add original MIME type
      formData.append("fileExtension", file.name.split(".").pop() || ""); // Add file extension

      const response = await new Promise<{
        url?: string;
        complete?: boolean;
        error?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const chunkProgress = (e.loaded / e.total) * 100;
            const overallProgress =
              ((offset + (e.loaded * CHUNK_SIZE) / e.total) / totalSize) * 100;
            onProgress({
              progress: Math.min(overallProgress, 99),
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
              reject(new Error("Failed to parse chunk upload response"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorResponse.error ||
                    `Chunk upload failed with status ${xhr.status}`
                )
              );
            } catch {
              reject(
                new Error(`Chunk upload failed with status ${xhr.status}`)
              );
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Chunk upload failed"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Chunk upload aborted"));
        });

        xhr.open("POST", "/api/upload/video");
        xhr.send(formData);
      });

      if (response.complete && response.url) {
        onProgress?.({
          progress: 100,
          status: "complete",
        });
        return response.url;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      offset += CHUNK_SIZE;
      retryCount = 0; // Reset retry count on successful chunk

      // Update progress for chunk completion
      onProgress?.({
        progress: Math.min((offset / totalSize) * 100, 99),
        status: "uploading",
      });
    } catch (error) {
      console.error(`Error uploading chunk at offset ${offset}:`, error);
      retryCount++;

      if (retryCount >= maxRetries) {
        throw new Error(
          `Failed to upload video after ${maxRetries} retries: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
    }
  }

  throw new Error("Upload failed to complete");
};

// Utility function to get video size limit based on subscription
export const getVideoSizeLimit = async (): Promise<number> => {
  try {
    const response = await fetch("/api/subscription/status");
    if (!response.ok) {
      return 100 * 1024 * 1024; // Default 100MB for free tier
    }

    const subscription = await response.json();
    const tier = subscription.tier || "free";

    const limits = {
      free: 100 * 1024 * 1024, // 100MB
      premium: 500 * 1024 * 1024, // 500MB
      pro: 2 * 1024 * 1024 * 1024, // 2GB
    };

    return limits[tier as keyof typeof limits] || limits.free;
  } catch (error) {
    console.error("Error getting video size limit:", error);
    return 100 * 1024 * 1024; // Default to free tier limit
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validate video file before upload
export const validateVideoFile = (
  file: File
): { valid: boolean; error?: string } => {
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/avi",
    "video/x-msvideo",
    "video/mkv",
    "video/x-matroska",
    "video/mov",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        "Invalid video format. Please upload MP4, WebM, MOV, or AVI files only.",
    };
  }

  return { valid: true };
};

export default uploadVideo;
