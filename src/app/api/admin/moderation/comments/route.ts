import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all comments for moderation
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100 most recent comments
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
        reports: true,
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments for moderation:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { commentId } = await request.json();
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
