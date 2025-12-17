import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const friends = await prisma.friend.findMany({
      where: { userId: session.user.id },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
      },
    });

    type Friendship = {
      friend: {
        id: string;
        name: string | null;
        image: string | null;
        lastSeen: Date | null;
      };
    };

    // Calculate if each friend is active (seen in last 5 minutes)
    const friendsWithStatus = friends.map((friendship: Friendship) => {
      const isActive = friendship.friend.lastSeen
        ? new Date().getTime() -
            new Date(friendship.friend.lastSeen).getTime() <
          5 * 60 * 1000
        : false;

      return {
        ...friendship.friend,
        isActive,
      };
    });

    return NextResponse.json({
      friends: friendsWithStatus,
    });
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Remove friendship (both directions)
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId: userId },
          { userId: userId, friendId: session.user.id },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("[FRIENDS_DELETE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
