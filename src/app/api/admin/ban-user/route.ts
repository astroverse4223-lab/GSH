import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { username, reason, duration } = await request.json();

    if (!username || !reason) {
      return NextResponse.json(
        { error: "Username and reason are required" },
        { status: 400 }
      );
    }

    // Find user to ban (search by name field in database)
    const userToBan = await prisma.user.findFirst({
      where: { name: username },
    });

    if (!userToBan) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userToBan.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot ban admin users" },
        { status: 400 }
      );
    }

    // Calculate ban expiration
    let banExpiresAt = null;
    if (duration && duration !== "permanent") {
      const now = new Date();
      // If duration is a number, treat as days
      if (typeof duration === "number") {
        banExpiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      } else if (typeof duration === "string") {
        switch (duration) {
          case "1h":
            banExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case "24h":
            banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "7d":
            banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }
    }

    // Ban the user
    const bannedUser = await prisma.user.update({
      where: { id: userToBan.id },
      data: {
        banned: true,
        banReason: reason,
        bannedAt: new Date(),
        banExpiresAt,
      },
    });

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "BAN_USER",
        targetUserId: userToBan.id,
        reason,
        metadata: {
          name: userToBan.name,
          duration: duration || "permanent",
          banExpiresAt: banExpiresAt?.toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "User banned successfully",
      user: {
        id: bannedUser.id,
        name: bannedUser.name,
        banned: bannedUser.banned,
        banReason: bannedUser.banReason,
        bannedAt: bannedUser.bannedAt,
        banExpiresAt: bannedUser.banExpiresAt,
      },
    });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
