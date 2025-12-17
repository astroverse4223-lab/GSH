import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (
      !session?.user?.email ||
      session.user.email !== "countryboya20@gmail.com"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current date for today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all stats in parallel
    const [
      totalUsers,
      totalPosts,
      totalReports,
      pendingReports,
      bannedUsers,
      todaySignups,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.post.count(),

      prisma.report.count(),

      prisma.report.count({
        where: { status: "PENDING" },
      }),

      prisma.user.count({
        where: { banned: true },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    const stats = {
      totalUsers,
      totalPosts,
      totalReports,
      pendingReports,
      bannedUsers,
      todaySignups,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
