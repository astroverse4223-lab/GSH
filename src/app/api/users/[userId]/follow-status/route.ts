import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ isFriend: false }, { status: 401 });
    }

    const { userId: targetUserId } = await context.params;
    const currentUserId = session.user.id;

    // Don't check friend status for the same user
    if (targetUserId === currentUserId) {
      return NextResponse.json({ isFriend: false });
    }

    // Check if they're already friends
    const friend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUserId },
          { userId: targetUserId, friendId: currentUserId },
        ],
      },
    });

    // If they're not friends, check if there's a pending request
    const friendRequest = !friend
      ? await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: currentUserId },
            ],
          },
        })
      : null;

    return NextResponse.json({
      isFriend: Boolean(friend),
      status: friendRequest ? friendRequest.status : friend ? "FRIENDS" : null,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
