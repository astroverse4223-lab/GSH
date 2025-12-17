import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    postId: string;
    commentId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    const { commentId } = await context.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    interface Reaction {
      emoji: string;
      user: {
        id: string;
      };
    }

    // Calculate reaction counts
    const reactionCounts = {
      "🔥": comment.reactions.filter((r: Reaction) => r.emoji === "🔥").length,
      "🎮": comment.reactions.filter(
        (r: Reaction) => r.emoji === "🎮" || r.emoji === "GG"
      ).length,
      "💀": comment.reactions.filter((r: Reaction) => r.emoji === "💀").length,
      "😂": comment.reactions.filter((r: Reaction) => r.emoji === "😂").length,
    };

    // Get user's reaction if they're logged in
    const userReaction = currentUser
      ? comment.reactions.find((r: Reaction) => r.user.id === currentUser.id)
          ?.emoji || null
      : null;

    return NextResponse.json({
      reactionCounts,
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching reaction counts:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
