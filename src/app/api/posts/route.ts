import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { canUserCreatePost } from "@/lib/subscription";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    // Get blocked user IDs if user is logged in
    const blockedUserIds = currentUser
      ? await prisma.blockedUser
          .findMany({
            where: { blockerId: currentUser.id },
            select: { blockedId: true },
          })
          .then((blocks) => blocks.map((block) => block.blockedId))
      : [];

    // Helper function to calculate reaction counts
    const calculateReactionCounts = (reactions: Reaction[]) => ({
      "🔥": reactions.filter((r) => r.emoji === "🔥").length,
      GG: reactions.filter((r) => r.emoji === "GG").length,
      "💀": reactions.filter((r) => r.emoji === "💀").length,
      "😂": reactions.filter((r) => r.emoji === "😂").length,
    });

    // Fetch posts with comments, reactions, user details, and active boosts
    // Only fetch posts that are NOT in groups (main feed posts only)
    // Exclude posts from blocked users
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { groupId: { isSet: false } }, // MongoDB/Prisma requires isSet: false instead of null
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
          include: {
            user: true,
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
            reactions: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        group: {
          select: {
            id: true,
            name: true,
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
            comments: true,
          },
        },
      },
    });

    type User = {
      id: string;
      name: string | null;
      image: string | null;
    };

    type Reaction = {
      emoji: string;
      user: User;
    };

    type Comment = {
      user: User;
      reactions: Reaction[];
    };

    type Boost = {
      id: string;
      expiresAt: Date;
      type: string;
      createdAt: Date;
    };

    type Post = {
      reactions: Reaction[];
      comments: Comment[];
      boosts: Boost[];
      createdAt: Date | null;
      user: User;
      group: { id: string; name: string } | null;
      _count: { comments: number };
    };

    // Transform posts and their comments to include reaction counts
    const transformedPosts = posts.map((post: Post) => {
      // Calculate post reaction counts
      const postReactionCounts = {
        "🔥": post.reactions.filter((r: Reaction) => r.emoji === "🔥").length,
        GG: post.reactions.filter((r: Reaction) => r.emoji === "GG").length,
        "💀": post.reactions.filter((r: Reaction) => r.emoji === "💀").length,
        "😂": post.reactions.filter((r: Reaction) => r.emoji === "😂").length,
      };

      // Calculate user's reaction if they're logged in
      const userReaction = currentUser
        ? post.reactions.find((r) => r.user.id === currentUser.id)?.emoji ||
          null
        : null;

      // Transform comments with their reaction counts
      // Filter out comments from blocked users
      const transformedComments = post.comments
        .filter((comment: Comment) => !blockedUserIds.includes(comment.user.id))
        .map((comment: Comment) => {
          const commentReactionCounts = {
            "🔥": comment.reactions.filter((r: Reaction) => r.emoji === "🔥")
              .length,
            GG: comment.reactions.filter((r: Reaction) => r.emoji === "GG")
              .length,
            "💀": comment.reactions.filter((r: Reaction) => r.emoji === "💀")
              .length,
            "😂": comment.reactions.filter((r: Reaction) => r.emoji === "😂")
              .length,
          };

          const commentUserReaction = currentUser
            ? comment.reactions.find((r) => r.user.id === currentUser.id)
                ?.emoji || null
            : null;

          return {
            ...comment,
            userReaction: commentUserReaction,
            reactionCounts: commentReactionCounts,
            reactions: undefined,
          };
        });

      return {
        ...post,
        userReaction,
        reactionCounts: postReactionCounts,
        reactions: undefined,
        comments: transformedComments,
        createdAt:
          post.createdAt instanceof Date
            ? post.createdAt.toISOString()
            : post.createdAt,
        isBoasted: post.boosts && post.boosts.length > 0,
        boostExpiresAt:
          post.boosts && post.boosts.length > 0
            ? post.boosts[0].expiresAt.toISOString()
            : null,
      };
    });

    // Sort posts: boosted posts first (by boost creation date), then regular posts by creation date
    const sortedPosts = transformedPosts.sort((a: any, b: any) => {
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
    console.error("Error fetching posts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const { content, image, groupId } = json;

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check subscription limits for post creation
    const postPermission = await canUserCreatePost(currentUser.id);
    if (!postPermission.allowed) {
      return new NextResponse(
        JSON.stringify({ error: postPermission.reason }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          content,
          image,
          userId: currentUser.id,
          ...(groupId && {
            groupId,
          }),
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
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
      });

      return { post };
    });

    // Transform the post for response
    const transformedPost = {
      ...result.post,
      userReaction: null,
      _count: {
        ...result.post._count,
        reactions: {
          fire: 0,
          gg: 0,
          skull: 0,
          laugh: 0,
        },
      },
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
