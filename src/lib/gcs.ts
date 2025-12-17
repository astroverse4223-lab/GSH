import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key file
  // Alternative: Use base64 encoded service account key
  // credentials: JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64!, 'base64').toString())
});

const bucketName =
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET || "gamer-social-videos";
const bucket = storage.bucket(bucketName);

export interface VideoUploadOptions {
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export class GCSVideoUploader {
  static async uploadVideo(
    buffer: Buffer,
    options: VideoUploadOptions
  ): Promise<string> {
    try {
      // Sanitize filename - remove spaces and special characters
      const sanitizedFileName = options.fileName
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, "") // Remove special characters except dots, underscores, hyphens
        .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `videos/${timestamp}-${sanitizedFileName}`;

      const file = bucket.file(uniqueFileName);

      // Set upload options
      const uploadOptions = {
        metadata: {
          contentType: options.contentType,
          metadata: {
            ...options.metadata,
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: true, // Enable resumable uploads for large files
        validation: "crc32c", // Enable validation
      };

      // Upload the file
      await file.save(buffer, uploadOptions);

      // Try to make the file publicly accessible
      // If uniform bucket-level access is enabled, this will fail but that's okay
      try {
        await file.makePublic();
        console.log(`File made public: ${uniqueFileName}`);
      } catch (publicError: any) {
        // If uniform bucket-level access is enabled, we can't make individual files public
        // This is expected and the file should still be accessible if bucket is configured correctly
        console.log(
          `Could not make file public (this is normal with uniform bucket-level access): ${publicError.message}`
        );
      }

      // Return the public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;

      console.log(`Video uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading video to GCS:", error);
      throw new Error(
        `Failed to upload video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async uploadVideoStream(
    fileStream: NodeJS.ReadableStream,
    options: VideoUploadOptions
  ): Promise<string> {
    try {
      // Sanitize filename - remove spaces and special characters
      const sanitizedFileName = options.fileName
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, "") // Remove special characters except dots, underscores, hyphens
        .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

      const timestamp = Date.now();
      const uniqueFileName = `videos/${timestamp}-${sanitizedFileName}`;

      const file = bucket.file(uniqueFileName);

      const stream = file.createWriteStream({
        metadata: {
          contentType: options.contentType,
          metadata: {
            ...options.metadata,
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: true,
        validation: "crc32c",
      });

      return new Promise((resolve, reject) => {
        stream.on("error", (error) => {
          console.error("Upload stream error:", error);
          reject(error);
        });

        stream.on("finish", async () => {
          try {
            // Try to make the file publicly accessible
            try {
              await file.makePublic();
              console.log(`File made public: ${uniqueFileName}`);
            } catch (publicError: any) {
              console.log(
                `Could not make file public (this is normal with uniform bucket-level access): ${publicError.message}`
              );
            }

            const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;
            console.log(`Video uploaded successfully: ${publicUrl}`);
            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        });

        // Pipe the file stream to GCS
        fileStream.pipe(stream);
      });
    } catch (error) {
      console.error("Error uploading video stream to GCS:", error);
      throw new Error(
        `Failed to upload video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async deleteVideo(fileName: string): Promise<void> {
    try {
      const file = bucket.file(fileName);
      await file.delete();
      console.log(`Video deleted successfully: ${fileName}`);
    } catch (error) {
      console.error("Error deleting video from GCS:", error);
      throw new Error(
        `Failed to delete video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async getSignedUrl(
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const file = bucket.file(fileName);
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000, // Convert seconds to milliseconds
      });
      return url;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Check if bucket exists and is accessible
  static async checkBucketAccess(): Promise<boolean> {
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.warn(`Bucket ${bucketName} does not exist`);
        return false;
      }

      // Try to list files to check permissions
      await bucket.getFiles({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error("Error checking bucket access:", error);
      return false;
    }
  }
}

export default GCSVideoUploader;
