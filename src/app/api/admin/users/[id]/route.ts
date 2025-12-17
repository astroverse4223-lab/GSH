import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Check if user is admin
    if (
      !session?.user?.email ||
      session.user.email !== "countryboya20@gmail.com"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Don't allow admin to delete themselves
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (userToDelete?.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete the user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user's posts first (due to foreign key constraints)
      await tx.post.deleteMany({
        where: { userId: id },
      });

      // Delete user's comments
      await tx.comment.deleteMany({
        where: { userId: id },
      });

      // Delete user's post reactions
      await tx.postReaction.deleteMany({
        where: { userId: id },
      });

      // Delete user's comment reactions
      await tx.commentReaction.deleteMany({
        where: { userId: id },
      });

      // Delete user's followers/following relationships
      await tx.follows.deleteMany({
        where: {
          OR: [{ followerId: id }, { followingId: id }],
        },
      });

      // Delete user's reports (both as reporter and reported)
      try {
        await tx.report.deleteMany({
          where: {
            OR: [{ reporterId: id }, { reportedUserId: id }],
          },
        });
      } catch (error) {
        // Skip if report model doesn't exist or has different field names
        console.log("Skipping report deletion - model may not exist");
      }

      // Delete user's subscription if exists
      try {
        await tx.subscription.deleteMany({
          where: { userId: id },
        });
      } catch (error) {
        // Skip if subscription model doesn't exist
        console.log("Skipping subscription deletion - model may not exist");
      }

      // Delete user's game-related data
      try {
        // Delete GamePlayer records
        await tx.gamePlayer.deleteMany({
          where: { userId: id },
        });
      } catch (error) {
        console.log("Skipping GamePlayer deletion - model may not exist");
      }

      try {
        // Delete user's friend requests (both sent and received)
        await tx.friendRequest.deleteMany({
          where: {
            OR: [{ senderId: id }, { receiverId: id }],
          },
        });
      } catch (error) {
        console.log("Skipping FriendRequest deletion - model may not exist");
      }

      try {
        // Delete user's friendships
        await tx.friend.deleteMany({
          where: {
            OR: [{ userId: id }, { friendId: id }],
          },
        });
      } catch (error) {
        console.log("Skipping Friend deletion - model may not exist");
      }

      try {
        // Delete user's group memberships
        await tx.groupMember.deleteMany({
          where: { userId: id },
        });
      } catch (error) {
        console.log("Skipping GroupMember deletion - model may not exist");
      }

      try {
        // Delete user's notifications (both sent and received)
        await tx.notification.deleteMany({
          where: {
            OR: [{ userId: id }, { senderId: id }],
          },
        });
      } catch (error) {
        console.log("Skipping Notification deletion - model may not exist");
      }

      try {
        // Delete user's marketplace listings
        await tx.marketplaceListing.deleteMany({
          where: { sellerId: id },
        });
      } catch (error) {
        console.log(
          "Skipping MarketplaceListing deletion - model may not exist"
        );
      }

      try {
        // Delete user's conversations/messages where they are a participant
        await tx.conversation.deleteMany({
          where: {
            participantIds: {
              has: id,
            },
          },
        });
      } catch (error) {
        console.log("Skipping Conversation deletion - model may not exist");
      }

      try {
        // Delete user's stories
        await tx.story.deleteMany({
          where: { userId: id },
        });
      } catch (error) {
        console.log("Skipping Story deletion - model may not exist");
      }

      // Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Check if user is admin
    if (
      !session?.user?.email ||
      session.user.email !== "countryboya20@gmail.com"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { banned, banReason } = await request.json();

    // Update user ban status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        banned: banned,
        bannedAt: banned ? new Date() : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        banned: true,
        bannedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: banned
        ? `User ${updatedUser.name || updatedUser.email} has been banned`
        : `User ${updatedUser.name || updatedUser.email} has been unbanned`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Check if user is admin
    if (
      !session?.user?.email ||
      session.user.email !== "countryboya20@gmail.com"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        banned: true,
        bannedAt: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastSeen: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            commentReactions: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
