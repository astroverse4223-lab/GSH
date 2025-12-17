import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "@/lib/notifications/index";

// Configure Cloudinary
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error("Cloudinary configuration is missing");
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");
    let content = "";
    let receiverId = "";
    let conversationId = "";
    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload with FormData
      const formData = await req.formData();
      content = (formData.get("content") as string) || "";
      receiverId = formData.get("receiverId") as string;
      conversationId = formData.get("conversationId") as string;

      const file = formData.get("file") as File;

      if (file) {
        // Validate file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "File size must be less than 10MB" },
            { status: 400 }
          );
        }

        try {
          // Convert file to buffer
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Upload to Cloudinary instead of local filesystem
          const dataURI = `data:${file.type};base64,${buffer.toString(
            "base64"
          )}`;

          const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "messages",
            resource_type: "auto", // Supports images, videos, and other files
          });

          fileUrl = uploadResponse.secure_url;
          fileName = file.name;
          fileType = file.type;
          fileSize = file.size;
        } catch (uploadError) {
          console.error("Error uploading file to Cloudinary:", uploadError);
          return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
          );
        }
      }
    } else {
      // Handle JSON content
      const body = await req.json();
      content = body.content;
      receiverId = body.receiverId;
      conversationId = body.conversationId;
    }

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: "Content or file is required" },
        { status: 400 }
      );
    }

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver is required" },
        { status: 400 }
      );
    }

    // Find or create conversation between users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participantIds: { has: session.user.id } },
          { participantIds: { has: receiverId } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participantIds: [session.user.id, receiverId],
          participants: {
            connect: [{ id: session.user.id }, { id: receiverId }],
          },
        },
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        senderId: session.user.id,
        receiverId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Send push notification to receiver
    try {
      await createNotification({
        userId: receiverId,
        senderId: session.user.id,
        type: "MESSAGE",
        content: `${session.user.name} sent you a message`,
        link: `/messages?userId=${session.user.id}`,
        messageId: message.id,
      });
    } catch (notificationError) {
      console.error("Error sending message notification:", notificationError);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error in messages POST:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");

    if (conversationId) {
      // Get messages from a specific conversation
      const messages = await prisma.message.findMany({
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(messages);
    } else if (userId) {
      // Find or create conversation with specific user
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participantIds: { has: session.user.id } },
            { participantIds: { has: userId } },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participantIds: [session.user.id, userId],
            participants: {
              connect: [{ id: session.user.id }, { id: userId }],
            },
          },
        });
      }

      const messages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ conversation, messages });
    }

    // Get all conversations for the current user
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: session.user.id,
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error in messages GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Check if the message exists and user is the sender
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
