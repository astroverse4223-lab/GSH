import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { awardEnhancedXP } from "@/lib/enhanced-xp-system";

export async function POST(request: Request) {
  try {
    // Get admin session
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== "countryboya20@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, activity, amount, reason } = await request.json();

    if (!userId || !activity) {
      return NextResponse.json(
        { error: "User ID and activity are required" },
        { status: 400 }
      );
    }

    // Award XP to the specified user
    const result = await awardEnhancedXP(userId, activity, {
      customAmount: amount,
      adminReason: reason,
      awardedBy: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      xpGained: result.xpGained,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      userId,
      activity,
      reason,
    });
  } catch (error) {
    console.error("Error awarding XP to user:", error);
    return NextResponse.json({ error: "Failed to award XP" }, { status: 500 });
  }
}
