import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      newUsers,
      recentPosts,
      recentComments,
      totalSubscriptions,
      totalReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          lastSeen: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
        },
      }),
      prisma.report.count(),
    ]);

    const engagementRate =
      totalUsers > 0
        ? (((recentPosts + recentComments) / totalUsers) * 100).toFixed(2)
        : 0;

    return NextResponse.json({
      userStats: {
        totalUsers,
        newUsers,
        activeUsers,
        bannedUsers: 0, // We'll implement this later
        proUsers: totalSubscriptions,
        retentionRate:
          totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0",
      },
      contentStats: {
        totalPosts,
        newPosts: recentPosts,
        totalComments,
        newComments: recentComments,
        totalMedia: 0, // We'll implement this later
        contentGrowth: ((recentPosts / totalPosts) * 100).toFixed(2),
      },
      engagementStats: {
        likes: 0, // We'll implement these with reactions later
        shares: 0,
        views: 0,
        messagesSent: 0,
        averageEngagementRate: Number(engagementRate),
      },
      moderationStats: {
        totalReports,
        resolvedReports: 0, // We'll implement this later
        deletedContent: 0,
        bannedUsers: 0,
        resolutionRate: 0,
      },
      revenueStats: {
        totalSubscriptions,
        newSubscriptions: 0, // We'll implement these later
        cancelledSubscriptions: 0,
        marketplaceRevenue: 0,
        churnRate: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
