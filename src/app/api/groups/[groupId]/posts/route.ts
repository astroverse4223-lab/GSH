import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { groupId } = await context.params;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get blocked user IDs if user is logged in
    const blockedUserIds = userId
      ? await prisma.blockedUser
          .findMany({
            where: { blockerId: userId },
            select: { blockedId: true },
          })
          .then((blocks) => blocks.map((block) => block.blockedId))
      : [];

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { groupId: groupId },
          ...(blockedUserIds.length > 0
            ? [{ userId: { notIn: blockedUserIds } }]
            : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
        boosts: {
          where: {
            AND: [
              { type: "POST_BOOST" },
              { expiresAt: { gt: new Date() } }, // Only active boosts
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 1, // Only get the most recent active boost
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    const postsWithReactionData = posts.map((post: any) => {
      // Get reaction counts by emoji
      const reactionCounts = {
        "🔥": 0,
        "🎮": 0,
        "💀": 0,
        "😂": 0,
      };

      post.reactions.forEach((reaction: any) => {
        if (reactionCounts.hasOwnProperty(reaction.emoji)) {
          reactionCounts[reaction.emoji as keyof typeof reactionCounts]++;
        }
      });

      // Get user's reaction if they are logged in
      const userReaction = userId
        ? post.reactions.find((r: any) => r.userId === userId)?.emoji || null
        : null;

      // Add boost information
      const isBoasted = post.boosts && post.boosts.length > 0;
      const boostExpiresAt = isBoasted
        ? post.boosts[0].expiresAt.toISOString()
        : null;

      const { reactions, boosts, ...postWithoutReactions } = post;
      return {
        ...postWithoutReactions,
        reactionCounts,
        userReaction,
        isBoasted,
        boostExpiresAt,
        createdAt: post.createdAt.toISOString(),
      };
    });

    // Sort posts: boosted posts first (by boost creation date), then regular posts by creation date
    const sortedPosts = postsWithReactionData.sort((a: any, b: any) => {
      // If both posts are boosted, sort by boost expiration date (most recent boost first)
      if (a.isBoasted && b.isBoasted) {
        return (
          new Date(b.boostExpiresAt).getTime() -
          new Date(a.boostExpiresAt).getTime()
        );
      }

      // If only one is boosted, boosted post goes first
      if (a.isBoasted && !b.isBoasted) return -1;
      if (!a.isBoasted && b.isBoasted) return 1;

      // If neither is boosted, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sortedPosts);
  } catch (error) {
    console.error("Error fetching group posts:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request, context: Context) {
  try {
    const { groupId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, image } = await req.json();

    // Validate content
    if (!content || content.trim().length === 0) {
      return new NextResponse("Content is required", { status: 400 });
    }

    // Check if user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse("Must be a member to post", { status: 403 });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        content,
        image,
        userId: session.user.id,
        groupId: groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    // Format post with reaction data
    const { reactions, ...postWithoutReactions } = post;
    const postWithReactionData = {
      ...postWithoutReactions,
      reactionCounts: {
        "🔥": 0,
        "🎮": 0,
        "💀": 0,
        "😂": 0,
      },
      userReaction: null,
    };

    return NextResponse.json(postWithReactionData);
  } catch (error) {
    console.error("Error creating group post:", error);
    // Check for specific error types
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
