import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications/index";

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, parentId, reactionEmoji } = (await request.json()) as {
      content: string;
      parentId?: string;
      reactionEmoji?: "🔥" | "GG" | "💀" | "😂";
    };

    if (!content?.trim()) {
      return new NextResponse("Comment content is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { postId } = await context.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (parentId) {
      // This is a reply to another comment
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        user: { connect: { id: user.id } },
        post: { connect: { id: post.id } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        reactions: reactionEmoji
          ? {
              create: {
                emoji: reactionEmoji,
                userId: user.id,
              },
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            reactions: {
              where: {
                userId: user.id,
              },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    });

    // Create notification for post owner if it's not their own comment
    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "POST_COMMENT",
          content: `${user.name || "Someone"} commented on your post`,
          userId: post.userId,
          senderId: user.id,
          postId: post.id,
        },
      });

      // Send push notification for comment
      try {
        await createNotification({
          userId: post.userId,
          senderId: user.id,
          type: "POST_COMMENT",
          content: `${user.name} commented on your post`,
          link: `/post/${post.id}`,
          postId: post.id,
        });
      } catch (notificationError) {
        console.error("Error sending comment notification:", notificationError);
      }
    }

    interface CommentReaction {
      userId: string;
      emoji: string;
    }

    // Format the response to include reaction info and counts
    const userReaction =
      comment.reactions.find((r: CommentReaction) => r.userId === user.id)
        ?.emoji || null;
    const reactionCounts = {
      "🔥": comment.reactions.filter((r: CommentReaction) => r.emoji === "🔥")
        .length,
      GG: comment.reactions.filter((r: CommentReaction) => r.emoji === "GG")
        .length,
      "💀": comment.reactions.filter((r: CommentReaction) => r.emoji === "💀")
        .length,
      "😂": comment.reactions.filter((r: CommentReaction) => r.emoji === "😂")
        .length,
    };

    return NextResponse.json({
      ...comment,
      userReaction,
      reactionCounts,
      reactions: undefined,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new NextResponse("Error creating comment", { status: 500 });
  }
}
