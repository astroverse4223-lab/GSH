import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    // Temporarily remove auth for debugging
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "debug") {
      // Show debug info about posts
      const recentPosts = await prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          groupId: true,
          createdAt: true,
          user: {
            select: { name: true },
          },
          group: {
            select: { name: true },
          },
        },
      });

      const postCounts = {
        total: await prisma.post.count(),
        mainFeed: await prisma.post.count({
          where: { groupId: null },
        }),
        withGroup: await prisma.post.count({
          where: { groupId: { not: null } },
        }),
      };

      return NextResponse.json({
        success: true,
        message: "Debug info retrieved",
        postCounts,
        recentPosts: recentPosts.map((post) => ({
          id: post.id,
          content: post.content.substring(0, 50) + "...",
          groupId: post.groupId,
          groupName: post.group?.name || null,
          authorName: post.user.name,
          createdAt: post.createdAt,
          isMainFeed: post.groupId === null,
        })),
      });
    }

    if (action === "migrate") {
      // Migrate 3 recent posts to main feed
      const postsToMigrate = await prisma.post.findMany({
        where: { groupId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          content: true,
          user: { select: { name: true } },
          group: { select: { name: true } },
        },
      });

      if (postsToMigrate.length === 0) {
        return NextResponse.json({
          success: false,
          message: "No group posts found to migrate",
        });
      }

      const result = await prisma.post.updateMany({
        where: {
          id: { in: postsToMigrate.map((p) => p.id) },
        },
        data: {
          groupId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Migrated ${result.count} posts to main feed`,
        migratedPosts: postsToMigrate.map((post) => ({
          id: post.id,
          content: post.content.substring(0, 50) + "...",
          authorName: post.user.name,
          fromGroup: post.group?.name,
        })),
      });
    }

    return NextResponse.json({
      success: false,
      message:
        "Use ?action=debug to see post info, or ?action=migrate to migrate posts",
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
