import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all posts for moderation (optionally filter by reported/flagged)
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent posts
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reports: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            reports: true,
          },
        },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts for moderation:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { postId } = await request.json();
    await prisma.post.delete({ where: { id: postId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
