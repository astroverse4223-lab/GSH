import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Admin check - for now allowing any logged-in user for testing
    // TODO: Replace with your actual admin email when ready for production
    const isAdmin = true; // session.user.email === "your-admin-email@example.com";
    if (!isAdmin) {
      console.log("User accessing migration:", session.user.email);
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const postIds = url.searchParams
      .get("postIds")
      ?.split(",")
      .filter((id) => id.trim());
    const count = parseInt(url.searchParams.get("count") || "5");

    if (action === "list") {
      // Show available posts for migration
      const groupPosts = await prisma.post.findMany({
        where: {
          groupId: { not: null },
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
        orderBy: { createdAt: "desc" },
        take: 15,
      });

      const mainFeedPostCount = await prisma.post.count({
        where: { groupId: null },
      });

      return NextResponse.json({
        success: true,
        groupPosts: groupPosts.map((post) => ({
          id: post.id,
          content: post.content,
          authorName: post.user.name,
          groupName: post.group?.name || "Unknown Group",
          groupId: post.groupId,
          createdAt: post.createdAt,
          stats: {
            reactions: post._count.reactions,
            comments: post._count.comments,
          },
        })),
        mainFeedPostCount,
        total: groupPosts.length,
      });
    }

    if (action === "migrate-recent") {
      // Migrate most recent posts
      const recentPosts = await prisma.post.findMany({
        where: { groupId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: count,
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

      const postIdsToMigrate = recentPosts.map((p) => p.id);

      const result = await prisma.post.updateMany({
        where: {
          id: { in: postIdsToMigrate },
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
          content: post.content.substring(0, 50) + "...",
          authorName: post.user.name,
          fromGroup: post.group?.name || "Unknown Group",
        })),
        count: result.count,
      });
    }

    if (action === "migrate-specific" && postIds && postIds.length > 0) {
      // Migrate specific posts
      const postsToMigrate = await prisma.post.findMany({
        where: {
          id: { in: postIds },
          groupId: { not: null },
        },
        include: {
          user: { select: { name: true } },
          group: { select: { name: true } },
        },
      });

      if (postsToMigrate.length === 0) {
        return NextResponse.json({
          success: false,
          message: "No valid group posts found with those IDs",
        });
      }

      const result = await prisma.post.updateMany({
        where: {
          id: { in: postIds },
        },
        data: {
          groupId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully migrated ${result.count} specific posts to main feed`,
        migratedPosts: postsToMigrate.map((post) => ({
          id: post.id,
          content: post.content.substring(0, 50) + "...",
          authorName: post.user.name,
          fromGroup: post.group?.name || "Unknown Group",
        })),
        count: result.count,
      });
    }

    return NextResponse.json({
      success: false,
      message:
        "Invalid action. Use ?action=list, ?action=migrate-recent&count=5, or ?action=migrate-specific&postIds=id1,id2",
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
