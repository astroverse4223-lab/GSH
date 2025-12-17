import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, count = 5 } = await request.json();

    if (action === "migrate-recent") {
      // Get the most recent posts from groups
      const recentPosts = await prisma.post.findMany({
        where: { groupId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: parseInt(count.toString()),
        include: {
          user: { select: { name: true } },
          group: { select: { name: true } },
        },
      });

      if (recentPosts.length === 0) {
        return NextResponse.json({
          success: false,
          message: "No group posts found to migrate",
        });
      }

      // Update posts to have groupId: null (making them main feed posts)
      const result = await prisma.post.updateMany({
        where: {
          id: { in: recentPosts.map((p) => p.id) },
        },
        data: {
          groupId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully migrated ${result.count} posts to main feed`,
        migratedPosts: recentPosts.map((post) => ({
          id: post.id,
          content:
            post.content.substring(0, 50) +
            (post.content.length > 50 ? "..." : ""),
          authorName: post.user?.name || "Unknown",
          fromGroup: post.group?.name || "Unknown Group",
        })),
        count: result.count,
      });
    }

    return NextResponse.json({
      success: false,
      message:
        "Invalid action. Send POST with { action: 'migrate-recent', count: 5 }",
    });
  } catch (error) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
