import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Get all users except the current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        lastSeen: true,
        _count: {
          select: {
            followers: true,
            following: true,
            friends: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100 users for performance
    });

    // Get relationship data for all users at once for better performance
    const userIds = users.map((user) => user.id);

    const [follows, friends, blockedUsers, friendRequests] = await Promise.all([
      // Following relationships
      prisma.follows.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds },
        },
        select: { followingId: true },
      }),

      // Friend relationships
      prisma.friend.findMany({
        where: {
          OR: [
            { userId: currentUserId, friendId: { in: userIds } },
            { friendId: currentUserId, userId: { in: userIds } },
          ],
        },
        select: { userId: true, friendId: true },
      }),

      // Blocked users
      prisma.blockedUser.findMany({
        where: {
          blockerId: currentUserId,
          blockedId: { in: userIds },
        },
        select: { blockedId: true },
      }),

      // Friend requests sent
      prisma.friendRequest.findMany({
        where: {
          senderId: currentUserId,
          receiverId: { in: userIds },
          status: "PENDING",
        },
        select: { receiverId: true },
      }),
    ]);

    // Create lookup sets for O(1) performance
    const followingSet = new Set(follows.map((f) => f.followingId));
    const friendSet = new Set(
      friends.flatMap((f) =>
        f.userId === currentUserId ? [f.friendId] : [f.userId]
      )
    );
    const blockedSet = new Set(blockedUsers.map((b) => b.blockedId));
    const requestSentSet = new Set(friendRequests.map((r) => r.receiverId));

    // Transform the data to include relationship status
    const transformedUsers = users.map((user) => ({
      _id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      lastSeen: user.lastSeen,
      followers: user._count.followers,
      following: user._count.following,
      friends: user._count.friends,
      isFollowing: followingSet.has(user.id),
      isFriend: friendSet.has(user.id),
      isBlocked: blockedSet.has(user.id),
      friendRequestSent: requestSentSet.has(user.id),
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
