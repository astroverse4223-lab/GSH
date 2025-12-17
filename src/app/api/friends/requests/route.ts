import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/index";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("[FRIEND_REQUEST] No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    console.log("[FRIEND_REQUEST] Request body:", body);
    console.log("[FRIEND_REQUEST] Session user ID:", session.user.id);

    const { userId } = body;
    if (!userId) {
      console.log("[FRIEND_REQUEST] No userId provided in request body");
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Check if trying to add themselves
    if (userId === session.user.id) {
      console.log("[FRIEND_REQUEST] User trying to add themselves");
      return new NextResponse("Cannot add yourself as friend", { status: 400 });
    }

    // Check if users are already friends
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: userId },
          { userId: userId, friendId: session.user.id },
        ],
      },
    });

    if (existingFriend) {
      return new NextResponse("Already friends", { status: 400 });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    if (existingRequest) {
      return new NextResponse("Friend request already exists", { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notification for the receiver
    await createNotification({
      userId: userId,
      senderId: session.user.id,
      type: "FRIEND_REQUEST",
      content: `${friendRequest.sender.name} sent you a friend request`,
      link: `/users/${session.user.id}`,
    });

    return NextResponse.json(friendRequest);
  } catch (error) {
    console.error("[FRIEND_REQUEST_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Get friend requests for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { receiverId: session.user.id, status: "PENDING" },
          { senderId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[FRIEND_REQUESTS_GET_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
