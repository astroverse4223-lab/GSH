import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{
    postId: string;
    commentId: string;
  }>;
};

export async function DELETE(request: Request, context: Context) {
  try {
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

    const { commentId } = await context.params;

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if the user is the comment owner
    if (comment.userId !== user.id) {
      return new NextResponse("Not authorized to delete this comment", {
        status: 403,
      });
    }

    // Delete the comment and all its associated reactions and replies
    await prisma.$transaction([
      // Delete all reactions for this comment
      prisma.commentReaction.deleteMany({
        where: { commentId: commentId },
      }),
      // Delete all replies to this comment and their reactions
      prisma.commentReaction.deleteMany({
        where: {
          comment: {
            parentId: commentId,
          },
        },
      }),
      prisma.comment.deleteMany({
        where: { parentId: commentId },
      }),
      // Delete the comment itself
      prisma.comment.delete({
        where: { id: commentId },
      }),
    ]);

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
