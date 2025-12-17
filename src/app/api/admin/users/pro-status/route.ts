import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get admin session
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== "countryboya20@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, enablePro } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Update user's subscription
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: {
          upsert: {
            create: {
              status: enablePro ? "active" : "canceled",
              tier: enablePro ? "pro" : "free",
              currentPeriodStart: enablePro ? new Date() : null,
              currentPeriodEnd: enablePro
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : null, // 30 days from now
              cancelAtPeriodEnd: !enablePro,
            },
            update: {
              status: enablePro ? "active" : "canceled",
              tier: enablePro ? "pro" : "free",
              currentPeriodStart: enablePro ? new Date() : null,
              currentPeriodEnd: enablePro
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : null,
              cancelAtPeriodEnd: !enablePro,
            },
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: enablePro ? "ENABLE_PRO" : "DISABLE_PRO",
        targetUserId: userId,
        reason: `Admin manually ${
          enablePro ? "enabled" : "disabled"
        } pro status`,
        metadata: {
          proExpiryDate: user.subscription?.currentPeriodEnd,
          timestamp: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pro status ${enablePro ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("Error updating pro status:", error);
    return NextResponse.json(
      { error: "Failed to update pro status" },
      { status: 500 }
    );
  }
}
