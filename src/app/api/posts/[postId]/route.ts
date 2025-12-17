import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { postId } = await context.params;

    const { content, image, video } = await request.json();

    if (!content || content.trim().length === 0) {
      return new NextResponse("Content is required", { status: 400 });
    }

    if (content.length > 2000) {
      return new NextResponse("Content too long", { status: 400 });
    }

    // Check if post exists and belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!existingPost) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (existingPost.userId !== session.user.id) {
      return new NextResponse("Forbidden - You can only edit your own posts", {
        status: 403,
      });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
        image: image || null,
        video: video || null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
            createdAt: "desc",
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
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { postId } = await context.params;
    console.log("Delete request received for postId:", postId);

    // Validate MongoDB ObjectId format (24 hex characters)
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid postId format");
      return new NextResponse("Invalid post ID format", { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Get the post and check if it exists in a group
    console.log("Looking for post with ID:", postId);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        group: true,
      },
    });

    if (!post) {
      console.log("Post not found in database");
      return new NextResponse("Post not found", { status: 404 });
    }

    console.log("Found post:", {
      id: post.id,
      userId: post.userId,
      groupId: post.groupId,
    });

    // If post is in a group, check group membership
    if (post.groupId) {
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId: userId,
          },
        },
        select: {
          role: true,
        },
      });

      // Check if user is post owner or group admin/owner
      const isPostOwner = post.userId === userId;
      const isGroupAdmin = member?.role === "ADMIN" || member?.role === "OWNER";

      if (!isPostOwner && !isGroupAdmin) {
        return new NextResponse(
          "Unauthorized: You don't have permission to delete this post",
          { status: 401 }
        );
      }
    } else {
      // For non-group posts, only the owner can delete
      if (post.userId !== userId) {
        return new NextResponse(
          "Unauthorized: You don't have permission to delete this post",
          { status: 401 }
        );
      }
    }

    // Delete the post and all associated comments and reactions
    await prisma.post.delete({
      where: { id: postId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting post:", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
