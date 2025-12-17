import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  awardEnhancedXP,
  handleDailyLogin,
  handleContentEngagement,
  getUserXPProgress,
  getDailyGoals,
  ENHANCED_XP_REWARDS,
} from "@/lib/enhanced-xp-system";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activity, metadata, contentType, engagementCount } =
      await req.json();

    let result = null;

    // Handle special activities
    if (activity === "DAILY_LOGIN") {
      const results = await handleDailyLogin(session.user.id);
      result = {
        results,
        totalXP: results.reduce((sum, r) => sum + r.xpGained, 0),
        activities: results.length,
      };
    } else if (activity === "CONTENT_ENGAGEMENT") {
      result = await handleContentEngagement(
        session.user.id,
        contentType,
        engagementCount
      );
    } else if (activity in ENHANCED_XP_REWARDS) {
      // Handle regular activities
      result = await awardEnhancedXP(session.user.id, activity, metadata);
    } else {
      return NextResponse.json({ error: "Invalid activity" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in enhanced XP API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "progress") {
      const progress = await getUserXPProgress(session.user.id);
      return NextResponse.json(progress);
    } else if (action === "goals") {
      const goals = getDailyGoals();
      return NextResponse.json({ goals });
    } else if (action === "rewards") {
      return NextResponse.json({
        rewards: ENHANCED_XP_REWARDS,
        activities: Object.keys(ENHANCED_XP_REWARDS),
      });
    } else {
      // Default: return user progress
      const progress = await getUserXPProgress(session.user.id);
      return NextResponse.json(progress);
    }
  } catch (error) {
    console.error("Error fetching enhanced XP data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
