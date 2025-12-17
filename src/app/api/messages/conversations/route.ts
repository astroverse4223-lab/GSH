import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find conversation between the two users
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { id: session.user.id },
            },
          },
          {
            participants: {
              some: { id: userId },
            },
          },
        ],
      },
      include: {
        messages: {
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
            createdAt: "asc",
          },
          take: 50, // Limit to last 50 messages
        },
      },
    });

    const messages = conversation?.messages || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { participantId, message, listingId } = await request.json();

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { id: session.user.id },
            },
          },
          {
            participants: {
              some: { id: participantId },
            },
          },
        ],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    let conversationId;

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: session.user.id }, { id: participantId }],
          },
        },
      });
      conversationId = newConversation.id;
    }

    // Add the message
    await prisma.message.create({
      data: {
        content: message,
        sender: {
          connect: { id: session.user.id },
        },
        receiver: {
          connect: { id: participantId },
        },
        conversation: {
          connect: { id: conversationId },
        },
        ...(listingId
          ? {
              listing: {
                connect: { id: listingId },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
