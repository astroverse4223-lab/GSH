import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Delete stream
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await context.params;

    // First check if the stream exists and belongs to the user
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { userId: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own streams" },
        { status: 403 }
      );
    }

    // Delete the stream
    await prisma.stream.delete({
      where: { id: streamId },
    });

    return NextResponse.json({ message: "Stream deleted successfully" });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return NextResponse.json(
      { error: "Error deleting stream" },
      { status: 500 }
    );
  }
}
