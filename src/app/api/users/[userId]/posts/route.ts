import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  try {
    // Get the session to check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await context.params;

    // Get all posts by the user, including their group posts
    const posts = await prisma.post.findMany({
      where: {
        // Only posts created by the user
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    interface Post {
      id: string;
      [key: string]: any;
    }

    // Get the reactions count and user reaction in a separate query
    const postsWithReactions = await Promise.all(
      posts.map(async (post: Post) => {
        const [userReaction, reactionCount] = await Promise.all([
          prisma.postReaction.findFirst({
            where: {
              postId: post.id,
              userId: session.user.id,
            },
          }),
          prisma.postReaction.count({
            where: {
              postId: post.id,
            },
          }),
        ]);

        return {
          ...post,
          userReaction: userReaction?.emoji || null,
          reactionsCount: reactionCount,
          commentsCount: post._count.comments,
        };
      })
    );

    return NextResponse.json(postsWithReactions);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
