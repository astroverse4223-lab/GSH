import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    if (userId === session.user.id) {
      return new NextResponse("Cannot block yourself", { status: 400 });
    }

    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToBlock) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId,
        },
      },
    });

    if (existingBlock) {
      return new NextResponse("User already blocked", { status: 409 });
    }

    // Create block relationship
    const block = await prisma.blockedUser.create({
      data: {
        blockerId: session.user.id,
        blockedId: userId,
        reason: reason || null,
      },
    });

    // Also remove any existing friend relationships
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId: userId },
          { userId: userId, friendId: session.user.id },
        ],
      },
    });

    // Cancel any pending friend requests
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    return NextResponse.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Remove block relationship
    const deleted = await prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId,
        },
      },
    });

    return NextResponse.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blockedUsers);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
