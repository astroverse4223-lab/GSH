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

    const { userId, userName } = await request.json();

    if (!userId && !userName) {
      return NextResponse.json(
        { error: "User ID or name is required" },
        { status: 400 }
      );
    }

    // Find user to unban
    const userToUnban = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst({ where: { name: userName } });

    if (!userToUnban) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userToUnban.banned) {
      return NextResponse.json(
        { error: "User is not banned" },
        { status: 400 }
      );
    }

    // Unban the user
    const unbannedUser = await prisma.user.update({
      where: { id: userToUnban.id },
      data: {
        banned: false,
        banReason: null,
        bannedAt: null,
        banExpiresAt: null,
      },
    });

    // Log the admin action
    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "UNBAN_USER",
        targetUserId: userToUnban.id,
        reason: "Manual unban by admin",
        metadata: {
          name: userToUnban.name,
          previousBanReason: userToUnban.banReason,
        },
      },
    });

    return NextResponse.json({
      message: "User unbanned successfully",
      user: {
        id: unbannedUser.id,
        name: unbannedUser.name,
        banned: unbannedUser.banned,
      },
    });
  } catch (error) {
    console.error("Unban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
