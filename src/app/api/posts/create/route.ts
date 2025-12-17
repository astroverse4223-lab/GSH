import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canUserCreatePost } from "@/lib/subscription";
import { awardEnhancedXP } from "@/lib/enhanced-xp-system";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check subscription limits for creating posts
    const postPermission = await canUserCreatePost(session.user.id);
    if (!postPermission.allowed) {
      return new NextResponse(
        JSON.stringify({ error: postPermission.reason }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { content, image, video } = await request.json();

    // Debug: Log what we're receiving
    console.log("Post creation data:", {
      content: content?.substring(0, 50) + "...",
      hasImage: !!image,
      hasVideo: !!video,
      imageUrl: image ? image.substring(0, 50) + "..." : null,
      videoUrl: video ? video.substring(0, 50) + "..." : null,
    });

    if (!content?.trim()) {
      return new NextResponse("Post content is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        video: video || null,
        userId: user.id,
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            reactions: true,
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

    // Debug: Check what was actually saved to database
    console.log("Post created successfully:", {
      postId: post.id,
      hasImage: !!post.image,
      hasVideo: !!post.video,
      imageUrl: post.image ? post.image.substring(0, 50) + "..." : null,
      videoUrl: post.video ? post.video.substring(0, 50) + "..." : null,
    });

    // Award XP for creating a post using enhanced system
    await awardEnhancedXP(user.id, "POST_CREATION");

    // Format the response with the new reaction structure
    const formattedPost = {
      ...post,
      userReaction: null,
      reactionCounts: {
        "🔥": 0,
        GG: 0,
        "💀": 0,
        "😂": 0,
      },
      reactions: undefined,
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
