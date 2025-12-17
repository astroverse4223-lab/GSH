import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type ReactionResponse = {
  reactionCounts: {
    "🔥": number;
    "🎮": number;
    "💀": number;
    "😂": number;
  };
  userReaction: "🔥" | "🎮" | "💀" | "😂" | null;
};

type Context = {
  params: Promise<{
    postId: string;
    commentId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { commentId, postId } = await context.params;
    const { emoji } = await request.json();

    if (!emoji || !["🔥", "🎮", "💀", "😂"].includes(emoji)) {
      return new NextResponse("Invalid emoji", { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if already reacted
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          commentId: commentId,
          userId: user.id,
        },
      },
    });

    if (existingReaction) {
      // If same emoji, delete the reaction
      if (existingReaction.emoji === emoji) {
        await prisma.commentReaction.delete({
          where: {
            userId_commentId: {
              commentId: commentId,
              userId: user.id,
            },
          },
        });

        return NextResponse.json({
          reactionCounts: await getReactionCounts(commentId),
          userReaction: null,
        } satisfies ReactionResponse);
      }

      // If different emoji, update the reaction
      await prisma.commentReaction.update({
        where: {
          userId_commentId: {
            commentId: commentId,
            userId: user.id,
          },
        },
        data: {
          emoji,
        },
      });

      return NextResponse.json({
        reactionCounts: await getReactionCounts(commentId),
        userReaction: emoji as "🔥" | "🎮" | "💀" | "😂",
      } satisfies ReactionResponse);
    }

    // Create new reaction
    await prisma.commentReaction.create({
      data: {
        emoji,
        comment: { connect: { id: commentId } },
        user: { connect: { id: user.id } },
      },
    });

    // Notify comment owner of the reaction if it's not their own comment
    if (comment.userId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT_REACTION",
          content: `${user.name || "Someone"} reacted ${emoji} to your comment`,
          userId: comment.userId,
          senderId: user.id,
          postId: comment.postId,
        },
      });
    }

    return NextResponse.json({
      reactionCounts: await getReactionCounts(commentId),
      userReaction: emoji as "🔥" | "🎮" | "💀" | "😂",
    } satisfies ReactionResponse);
  } catch (error) {
    console.error("Error reacting to comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request, context: Context) {
  try {
    const { commentId, postId } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Delete the reaction
    await prisma.commentReaction.delete({
      where: {
        userId_commentId: {
          commentId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      reactionCounts: await getReactionCounts(commentId),
      userReaction: null,
    } satisfies ReactionResponse);
  } catch (error) {
    console.error("Error handling comment reaction delete:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function getReactionKey(emoji: string): "🔥" | "🎮" | "💀" | "😂" | null {
  if (emoji === "🔥") return "🔥";
  if (emoji === "🎮") return "🎮";
  if (emoji === "💀") return "💀";
  if (emoji === "😂") return "😂";
  return null;
}

async function getReactionCounts(
  commentId: string
): Promise<ReactionResponse["reactionCounts"]> {
  const reactions = await prisma.commentReaction.groupBy({
    by: ["emoji"],
    where: { commentId },
    _count: true,
  });

  interface ReactionCount {
    emoji: string;
    _count: number;
  }

  // Format counts
  const counts = {
    "🔥": 0,
    "🎮": 0,
    "💀": 0,
    "😂": 0,
  };

  reactions.forEach((r: ReactionCount) => {
    const key = getReactionKey(r.emoji);
    if (key) counts[key] = r._count;
  });

  return counts;
}
