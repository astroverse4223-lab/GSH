import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ActivityItem {
  id: string;
  type: "USER_JOINED" | "POST_CREATED" | "REPORT_FILED" | "USER_BANNED";
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

export async function GET(request: Request) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.email ||
      session.user.email !== "countryboya20@gmail.com"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activities: ActivityItem[] = [];

    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Add user registrations to activities
    recentUsers.forEach((user) => {
      if (user.createdAt && user.email) {
        activities.push({
          id: `user_${user.id}`,
          type: "USER_JOINED",
          description: `${user.name || user.email} joined the platform`,
          timestamp: user.createdAt.toISOString(),
          user: {
            name: user.name || "Unknown",
            email: user.email,
          },
        });
      }
    });

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Add posts to activities
    recentPosts.forEach((post) => {
      if (post.createdAt && post.user.email) {
        activities.push({
          id: `post_${post.id}`,
          type: "POST_CREATED",
          description: `${
            post.user.name || post.user.email
          } created a new post: "${post.content.substring(0, 50)}${
            post.content.length > 50 ? "..." : ""
          }"`,
          timestamp: post.createdAt.toISOString(),
          user: {
            name: post.user.name || "Unknown",
            email: post.user.email,
          },
        });
      }
    });

    // Get recent reports
    const recentReports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        status: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Add reports to activities
    recentReports.forEach((report) => {
      if (report.reporter.email) {
        activities.push({
          id: `report_${report.id}`,
          type: "REPORT_FILED",
          description: `${
            report.reporter.name || report.reporter.email
          } filed a ${report.category} report: "${report.description.substring(
            0,
            50
          )}${report.description.length > 50 ? "..." : ""}"`,
          timestamp: report.createdAt.toISOString(),
          user: {
            name: report.reporter.name || "Unknown",
            email: report.reporter.email,
          },
        });
      }
    });

    // Get recently banned users (if you have a banned field or status)
    try {
      const bannedUsers = await prisma.user.findMany({
        where: {
          AND: [
            { banned: true },
            {
              updatedAt: {
                gte: oneDayAgo,
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
      });

      // Add banned users to activities
      bannedUsers.forEach((user) => {
        if (user.updatedAt && user.email) {
          activities.push({
            id: `banned_${user.id}`,
            type: "USER_BANNED",
            description: `${
              user.name || user.email
            } was banned from the platform`,
            timestamp: user.updatedAt.toISOString(),
            user: {
              name: user.name || "Unknown",
              email: user.email,
            },
          });
        }
      });
    } catch (error) {
      // If banned field doesn't exist, skip this section
      console.log("Banned users query skipped - field may not exist");
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return the formatted activities
    return NextResponse.json(activities.slice(0, 15));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Error fetching recent activity" },
      { status: 500 }
    );
  }
}
