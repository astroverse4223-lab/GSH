import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiOptions } from "cloudinary";
import { canUserUploadFile } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

// Configure route for large uploads
export const maxDuration = 300; // 5 minutes
export const runtime = "nodejs";

// Configure Cloudinary with environment variables
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error("Cloudinary configuration is missing");
  throw new Error(
    "Cloudinary configuration is missing. Please check your environment variables."
  );
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

// Constants - This route handles IMAGES and SMALL VIDEOS (≤100MB)
const ALLOWED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

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

// Image file validation
const validateImageFile = async (buffer: Buffer): Promise<boolean> => {
  try {
    // Check for common image signatures
    const isJPEG = buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const isPNG = buffer
      .slice(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebP = buffer.slice(8, 12).equals(Buffer.from("WEBP"));
    const isGIF =
      buffer.slice(0, 6).equals(Buffer.from("GIF87a")) ||
      buffer.slice(0, 6).equals(Buffer.from("GIF89a"));

    return isJPEG || isPNG || isWebP || isGIF;
  } catch (error) {
    console.error("Error validating image file:", error);
    return false;
  }
};

// Video file validation
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

// Types
interface CloudinaryError {
  http_code?: number;
  message?: string;
}

interface ChunkInfo {
  uploadId?: string;
  chunkStart: number;
  totalSize: number;
}

// Upload handler
export async function POST(request: Request): Promise<Response> {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file from form data
    const formData = await request.formData();
    let file = formData.get("file") as File;
    const chunkStart = Number(formData.get("chunkStart") || "0");
    const totalSize = Number(formData.get("totalSize") || "0");
    const uploadId = formData.get("uploadId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // DEBUG: Log initial file information
    console.log("=== UPLOAD DEBUG START ===");
    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
      chunkStart,
      totalSize,
    });
    console.log("=== UPLOAD DEBUG END ===");

    // Check storage limits before upload
    const storagePermission = await canUserUploadFile(
      session.user.id,
      file.size
    );
    if (!storagePermission.allowed) {
      return NextResponse.json(
        { error: storagePermission.reason },
        { status: 403 }
      );
    }

    // Check if this is a video file and redirect LARGE videos to video upload endpoint
    let isVideo = file.type.startsWith("video/");
    const fileExt = file.name.toLowerCase().split(".").pop() || "";

    // Check for video file extensions with incorrect MIME types
    if (!isVideo && ["mp4", "mov", "webm", "avi", "mkv"].includes(fileExt)) {
      isVideo = true;
    }

    // Only redirect LARGE videos (>100MB) to the GCS endpoint
    // Small videos (≤100MB) can still use Cloudinary for compatibility
    const videoSizeLimit = 100 * 1024 * 1024; // 100MB
    if (isVideo && file.size > videoSizeLimit) {
      return NextResponse.json(
        {
          error:
            "Large video files should be uploaded to /api/upload/video endpoint. Please use the video upload feature for files over 100MB.",
        },
        { status: 400 }
      );
    }

    // Validate file format - allow images and small videos
    const isValidImage = ALLOWED_IMAGE_FORMATS.includes(file.type);
    const isValidVideo =
      ALLOWED_VIDEO_FORMATS.includes(file.type) && file.size <= videoSizeLimit;

    if (!isValidImage && !isValidVideo) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. This endpoint accepts images (JPEG, PNG, WebP, GIF) and small videos (≤100MB).",
        },
        { status: 400 }
      );
    }

    // Log file details for debugging
    console.log("Processing file:", {
      type: file.type,
      extension: fileExt,
      size: file.size,
      name: file.name,
      chunkStart,
      totalSize,
    });

    // Convert chunk to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content based on type
    const isValidContent = ALLOWED_IMAGE_FORMATS.includes(file.type)
      ? await validateImageFile(buffer)
      : ALLOWED_VIDEO_FORMATS.includes(file.type)
      ? await validateVideoFile(buffer)
      : false;

    if (!isValidContent) {
      return NextResponse.json(
        {
          error:
            "Invalid file content. Please ensure your file is properly formatted.",
        },
        { status: 400 }
      );
    }

    // Check if this is the last chunk
    const isLastChunk = chunkStart + buffer.length >= totalSize;

    console.log("Processing chunk:", {
      chunkStart,
      chunkSize: buffer.length,
      totalSize,
      isLastChunk,
      mimeType: file.type,
      fileSize: file.size,
    });

    // Configure upload options for images and small videos
    const uploadOptions: UploadApiOptions = {
      folder: "gamer-social-hub",
      resource_type: isVideo ? "video" : "image",
      timeout: isVideo ? 300000 : 60000, // 5 minutes for videos, 1 minute for images
      chunk_size: 10000000, // 10MB chunks
      public_id: uploadId || undefined,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      filename_override: file.name,
    };

    // Add image-specific optimizations
    if (!isVideo) {
      uploadOptions.transformation = [
        {
          quality: "auto",
          fetch_format: "auto",
          width: 2048,
          height: 2048,
          crop: "limit",
        },
      ];
    }

    // Convert chunk to data URI for upload
    const dataURI = `data:${file.type};base64,${buffer.toString("base64")}`;

    try {
      // Upload chunk to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(
        dataURI,
        uploadOptions
      );

      // If this is the last chunk or a single upload, return the complete URL
      if (isLastChunk || !totalSize) {
        // Update user storage usage
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            storageUsed: {
              increment: BigInt(file.size),
            },
          },
        });

        return NextResponse.json({
          url: uploadResponse.secure_url,
          complete: true,
        });
      }

      // For intermediate chunks, return the upload ID for the next chunk
      return NextResponse.json({
        uploadId: uploadResponse.public_id,
        complete: false,
      });
    } catch (cloudinaryError: any) {
      console.error("Cloudinary upload error:", cloudinaryError);

      // Check if it's a configuration error
      if (cloudinaryError.message?.includes("config")) {
        return NextResponse.json(
          { error: "Media upload service configuration error" },
          { status: 500 }
        );
      }

      // Handle specific error cases
      if (cloudinaryError.http_code === 413) {
        return NextResponse.json(
          { error: "File size too large. Please upload a smaller file." },
          { status: 413 }
        );
      }

      if (cloudinaryError.http_code === 400) {
        return NextResponse.json(
          {
            error:
              "Image format not supported. Please ensure your image is a valid JPEG, PNG, WebP, or GIF file.",
          },
          { status: 400 }
        );
      }

      // Default error response for Cloudinary errors
      return NextResponse.json(
        { error: "Failed to process upload" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
