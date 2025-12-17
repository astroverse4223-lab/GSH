import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const [session, params] = await Promise.all([
      getServerSession(authOptions),
      context.params,
    ]);
    const { userId } = params;

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bannerImage: true,
        wallpaper: true,
        bio: true,
        createdAt: true,
        lastSeen: true,
        _count: {
          select: {
            posts: true,
            friends: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check relationship statuses (only if session exists)
    let isFollowing = false;
    let isFriend = false;
    let isBlocked = false;
    let friendRequestSent = false;

    if (session && session.user.id !== userId) {
      const [followRelation, friendRelation, blockRelation, friendRequest] =
        await Promise.all([
          prisma.follows.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: userId,
              },
            },
          }),
          prisma.friend.findFirst({
            where: {
              OR: [
                { userId: session.user.id, friendId: userId },
                { userId: userId, friendId: session.user.id },
              ],
            },
          }),
          prisma.blockedUser.findFirst({
            where: {
              blockerId: session.user.id,
              blockedId: userId,
            },
          }),
          prisma.friendRequest.findFirst({
            where: {
              senderId: session.user.id,
              receiverId: userId,
            },
          }),
        ]);

      isFollowing = !!followRelation;
      isFriend = !!friendRelation;
      isBlocked = !!blockRelation;
      friendRequestSent = !!friendRequest;
    }

    // Format the dates if they exist
    const formattedUser = {
      ...user,
      isFollowing,
      isFriend,
      isBlocked,
      friendRequestSent,
      followers: user._count.followers,
      following: user._count.following,
      friends: user._count.friends,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("[USER_GET_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
