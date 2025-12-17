import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

interface Reaction {
  emoji: string;
  user: {
    id: string;
  };
}

export async function GET(_: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    const { postId } = await context.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Calculate reaction counts
    const reactionCounts = {
      "🔥": post.reactions.filter((r: Reaction) => r.emoji === "🔥").length,
      "🎮": post.reactions.filter(
        (r: Reaction) => r.emoji === "🎮" || r.emoji === "GG"
      ).length,
      "💀": post.reactions.filter((r: Reaction) => r.emoji === "💀").length,
      "😂": post.reactions.filter((r: Reaction) => r.emoji === "😂").length,
    };

    // Get user's reaction if they're logged in
    const userReaction = currentUser
      ? post.reactions.find((r: Reaction) => r.user.id === currentUser.id)
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
