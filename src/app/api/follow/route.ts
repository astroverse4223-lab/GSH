import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Helper function to get follower and following count
async function getFollowCounts(userId: string | undefined) {
  if (!userId) {
    return { followers: 0, following: 0 };
  }

  // Validate MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    throw new Error("Invalid user ID format");
  }

  const [followers, following] = await Promise.all([
    prisma.follows.count({
      where: { followingId: userId },
    }),
    prisma.follows.count({
      where: { followerId: userId },
    }),
  ]);

  return { followers, following };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Check if already following
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Already following" }, { status: 400 });
    }

    // Create follow relationship
    await prisma.follows.create({
      data: {
        follower: { connect: { id: session.user.id } },
        following: { connect: { id: userId } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: "NEW_FOLLOWER",
        content: `${session.user.name || "Someone"} started following you`,
        userId: userId,
        senderId: session.user.id,
      },
    });

    // Get updated counts
    const counts = await getFollowCounts(userId);

    return NextResponse.json({
      message: "Successfully followed user",
      ...counts,
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Error following user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Delete follow relationship
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    // Get updated counts
    const counts = await getFollowCounts(userId);

    return NextResponse.json({
      message: "Successfully unfollowed user",
      ...counts,
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Error unfollowing user" },
      { status: 500 }
    );
  }
}

// Get follow status and counts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const [isFollowing, counts] = await Promise.all([
      prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId,
          },
        },
      }),
      getFollowCounts(userId),
    ]);

    return NextResponse.json({
      isFollowing: !!isFollowing,
      ...counts,
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return NextResponse.json(
      { error: "Error getting follow status" },
      { status: 500 }
    );
  }
}
