import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canUserUploadFile } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { GCSVideoUploader } from "@/lib/gcs";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Configure route for large uploads
export const maxDuration = 300; // 5 minutes
export const runtime = "nodejs";

// Chunked upload handler
interface ChunkUploadOptions {
  buffer: Buffer;
  chunkStart: number;
  totalSize: number;
  fileName: string;
  contentType: string;
  userId: string;
  userName: string;
}

const handleChunkedUpload = async (
  options: ChunkUploadOptions
): Promise<string> => {
  const {
    buffer,
    chunkStart,
    totalSize,
    fileName,
    contentType,
    userId,
    userName,
  } = options;

  // Create a unique upload ID based on file details
  const uploadId = `${userId}-${fileName}-${totalSize}`.replace(
    /[^a-zA-Z0-9-_]/g,
    "_"
  );
  const tempDir = path.join(os.tmpdir(), "video-chunks", uploadId);

  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Save this chunk to a temporary file
    const chunkFileName = `chunk-${String(chunkStart).padStart(12, "0")}`; // Pad with zeros for proper sorting
    const chunkPath = path.join(tempDir, chunkFileName);
    await fs.writeFile(chunkPath, buffer);

    console.log(
      `Saved chunk ${chunkStart} for upload ${uploadId} as ${chunkFileName}`
    );

    // Check if we have all chunks by reading the directory
    const existingChunks = await fs.readdir(tempDir);
    const chunkFiles = existingChunks
      .filter((f) => f.startsWith("chunk-"))
      .sort(); // They'll sort correctly now due to padding

    console.log(`Existing chunks in ${tempDir}:`, chunkFiles);

    // Calculate expected number of chunks (assuming 10MB chunk size)
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const expectedChunks = Math.ceil(totalSize / chunkSize);

    console.log(
      `Have ${chunkFiles.length} chunks, expecting ${expectedChunks}`
    );

    // Check if this is the last chunk by verifying we have all chunks
    let totalReceived = 0;
    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(tempDir, chunkFile);
      const stats = await fs.stat(chunkPath);
      totalReceived += stats.size;
    }

    // If we have all the data, assemble the file
    if (totalReceived >= totalSize || chunkFiles.length >= expectedChunks) {
      console.log(`Assembling complete file from ${chunkFiles.length} chunks`);

      // Read all chunks in order and combine them
      const chunks: Buffer[] = [];

      // Sort chunks by their offset to ensure correct order
      const sortedChunks = chunkFiles.sort((a, b) => {
        const offsetA = parseInt(a.replace("chunk-", ""));
        const offsetB = parseInt(b.replace("chunk-", ""));
        return offsetA - offsetB;
      });

      console.log(`Reading chunks in order:`, sortedChunks);

      for (const chunkFile of sortedChunks) {
        const chunkPath = path.join(tempDir, chunkFile);
        const chunkData = await fs.readFile(chunkPath);
        chunks.push(chunkData);
        console.log(`Read chunk ${chunkFile}: ${chunkData.length} bytes`);
      }

      // Combine all chunks into one buffer
      const completeFile = Buffer.concat(chunks);
      console.log(
        `Assembled file size: ${completeFile.length} bytes (expected: ${totalSize})`
      );

      // Upload the complete file to GCS
      const videoUrl = await GCSVideoUploader.uploadVideo(completeFile, {
        fileName,
        contentType,
        metadata: {
          userId,
          originalName: fileName,
          uploadedBy: userName,
          chunkInfo: `assembled-from-${chunkFiles.length}-chunks`,
        },
      });

      // Update user storage usage for the complete file
      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            increment: BigInt(totalSize),
          },
        },
      });

      console.log(
        `Updated storage usage for user ${userId}: +${totalSize} bytes`
      );

      // Clean up temporary files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory: ${tempDir}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up temp directory: ${cleanupError}`);
      }

      return videoUrl;
    } else {
      // Not all chunks received yet, return a pending response
      // DON'T clean up - we need the chunks for the next request
      console.log(
        `Chunks not complete yet: ${chunkFiles.length}/${expectedChunks} chunks received`
      );
      throw new Error(`CHUNK_PENDING:${chunkFiles.length}/${expectedChunks}`);
    }
  } catch (error) {
    // Only clean up on actual errors, not on CHUNK_PENDING
    if (
      !(typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string" && (error as any).message.startsWith("CHUNK_PENDING:"))
    ) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory on error: ${tempDir}`);
      } catch (cleanupError) {
        console.warn(
          `Failed to clean up temp directory on error: ${cleanupError}`
        );
      }
    }
    throw error;
  }
};

// Constants for video validation
const ALLOWED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/avi",
  "video/x-msvideo",
  "video/mkv",
  "video/x-matroska",
  "video/mov",
];

// Video size limits based on subscription tier
const VIDEO_SIZE_LIMITS = {
  free: 100 * 1024 * 1024, // 100MB
  premium: 500 * 1024 * 1024, // 500MB
  pro: 2 * 1024 * 1024 * 1024, // 2GB
};

// Video file signature validation
const validateVideoFile = async (buffer: Buffer): Promise<boolean> => {
  try {
    // Check for common video signatures
    const isFtyp = buffer.includes(Buffer.from("ftyp")); // MP4
    const isMoov = buffer.includes(Buffer.from("moov")); // MOV/MP4
    const isMdat = buffer.includes(Buffer.from("mdat")); // MOV/MP4
    const isWebm = buffer
      .slice(0, 4)
      .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])); // WebM

    return isFtyp || isMoov || isMdat || isWebm;
  } catch (error) {
    console.error("Error validating video file:", error);
    return false;
  }
};

// Get user's video size limit based on subscription
const getUserVideoSizeLimit = async (userId: string): Promise<number> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const tier = user?.subscription?.tier || "free";
    return (
      VIDEO_SIZE_LIMITS[tier as keyof typeof VIDEO_SIZE_LIMITS] ||
      VIDEO_SIZE_LIMITS.free
    );
  } catch (error) {
    console.error("Error getting user video size limit:", error);
    return VIDEO_SIZE_LIMITS.free;
  }
};

export async function POST(request: Request): Promise<Response> {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const chunkStart = Number(formData.get("chunkStart") || "0");
    const totalSize = Number(formData.get("totalSize") || "0");
    const fileName = formData.get("fileName") as string;
    const originalType = formData.get("originalType") as string;
    const fileExtension = formData.get("fileExtension") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // For chunked uploads, use the original file type for validation
    const fileTypeToValidate = originalType || file.type;
    const fileNameToUse = fileName || file.name;

    console.log("Video upload - file info:", {
      originalType,
      fileType: file.type,
      fileExtension,
      fileName: fileNameToUse,
      chunkStart,
      totalSize,
      isChunked: !!originalType,
    });

    // Validate file type - check original type or extension for chunked uploads
    const isValidFormat =
      ALLOWED_VIDEO_FORMATS.includes(fileTypeToValidate) ||
      (fileExtension &&
        ["mp4", "webm", "mov", "avi", "mkv"].includes(
          fileExtension.toLowerCase()
        ));

    if (!isValidFormat) {
      return NextResponse.json(
        {
          error:
            "Invalid video format. Please upload MP4, WebM, MOV, or AVI files only.",
        },
        { status: 400 }
      );
    }

    // Get user's video size limit (use totalSize for chunked uploads)
    const fileSizeToCheck = totalSize || file.size;
    const maxSize = await getUserVideoSizeLimit(session.user.id);

    // Check file size against user's limit
    if (fileSizeToCheck > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        {
          error: `Video file size exceeds your ${maxSizeMB}MB limit. Upgrade your subscription for larger videos.`,
        },
        { status: 413 }
      );
    }

    // Check storage limits before upload (use total file size for chunked uploads)
    const storagePermission = await canUserUploadFile(
      session.user.id,
      fileSizeToCheck
    );
    if (!storagePermission.allowed) {
      return NextResponse.json(
        { error: storagePermission.reason },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Skip content validation for chunks (since individual chunks won't have video headers)
    // Only validate content for single uploads (when chunkStart is 0 and no totalSize)
    if (!chunkStart && !totalSize) {
      const isValidVideo = await validateVideoFile(buffer);
      if (!isValidVideo) {
        return NextResponse.json(
          {
            error:
              "Invalid video file. Please ensure your video is properly encoded.",
          },
          { status: 400 }
        );
      }
    }

    // Check GCS access before attempting upload
    const hasAccess = await GCSVideoUploader.checkBucketAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Video upload service is temporarily unavailable" },
        { status: 503 }
      );
    }

    try {
      let videoUrl: string;

      // Handle chunked uploads vs single uploads
      if (totalSize && totalSize > file.size) {
        // This is a chunked upload - handle chunk assembly
        videoUrl = await handleChunkedUpload({
          buffer,
          chunkStart,
          totalSize,
          fileName: fileNameToUse,
          contentType: fileTypeToValidate,
          userId: session.user.id,
          userName: session.user.name || "Unknown",
        });
      } else {
        // This is a single upload
        videoUrl = await GCSVideoUploader.uploadVideo(buffer, {
          fileName: fileNameToUse,
          contentType: fileTypeToValidate,
          metadata: {
            userId: session.user.id,
            originalName: fileNameToUse,
            uploadedBy: session.user.name || "Unknown",
            chunkInfo: "single-upload",
          },
        });
      }

      // Update user storage usage only for complete uploads
      // For chunked uploads, only update when the final chunk completes the file
      if (!totalSize || totalSize <= file.size) {
        // Single upload - update storage immediately
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            storageUsed: {
              increment: BigInt(fileSizeToCheck),
            },
          },
        });
      } else {
        // Chunked upload - storage will be updated when file is complete
        // (handled inside handleChunkedUpload)
      }

      console.log(
        `Video uploaded successfully for user ${session.user.id}: ${videoUrl}`
      );

      return NextResponse.json({
        url: videoUrl,
        complete: true,
        size: fileSizeToCheck,
        type: fileTypeToValidate,
      });
    } catch (uploadError: any) {
      console.error("GCS upload error:", uploadError);

      // Handle chunk pending (not really an error, just need more chunks)
      if (uploadError.message?.startsWith("CHUNK_PENDING:")) {
        const [, progress] = uploadError.message.split(":");
        return NextResponse.json({
          uploadId: "chunked", // For compatibility
          complete: false,
          progress: progress,
          message: "Chunk received, waiting for more chunks",
        });
      }

      // Handle specific error cases
      if (uploadError.message?.includes("permission")) {
        return NextResponse.json(
          {
            error:
              "Video upload service permissions error. Please try again later.",
          },
          { status: 503 }
        );
      }

      if (uploadError.message?.includes("quota")) {
        return NextResponse.json(
          { error: "Video upload quota exceeded. Please try again later." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Failed to upload video. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error in video upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
