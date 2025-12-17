import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP_REWARDS } from "@/lib/xp-system";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        xp: true,
        level: true,
        lastLoginDate: true,
        loginStreak: true,
        totalLogins: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const lastLoginDay = lastLogin
      ? new Date(
          lastLogin.getFullYear(),
          lastLogin.getMonth(),
          lastLogin.getDate()
        )
      : null;

    // Check if user already logged in today
    if (lastLoginDay && lastLoginDay.getTime() === today.getTime()) {
      return NextResponse.json({
        alreadyLoggedInToday: true,
        xp: user.xp,
        level: user.level,
        loginStreak: user.loginStreak,
        totalLogins: user.totalLogins,
      });
    }

    // Calculate new streak
    let newStreak = 1;
    if (lastLoginDay) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLoginDay.getTime() === yesterday.getTime()) {
        // Consecutive day login
        newStreak = user.loginStreak + 1;
      }
    }

    // Calculate XP bonus based on streak
    let xpBonus: number = XP_REWARDS.DAILY_LOGIN;
    if (newStreak >= 7) {
      xpBonus = Math.floor(xpBonus * 1.5); // 50% bonus for 7+ day streak
    } else if (newStreak >= 3) {
      xpBonus = Math.floor(xpBonus * 1.2); // 20% bonus for 3+ day streak
    }

    const newXP = user.xp + xpBonus;
    const newLevel = Math.floor(newXP / 1000) + 1;
    const newTotalLogins = user.totalLogins + 1;

    // Update user with daily login data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xp: newXP,
        level: newLevel,
        lastLoginDate: new Date(),
        loginStreak: newStreak,
        totalLogins: newTotalLogins,
      },
      select: {
        xp: true,
        level: true,
        loginStreak: true,
        totalLogins: true,
      },
    });

    return NextResponse.json({
      xpGained: xpBonus,
      xp: updatedUser.xp,
      level: updatedUser.level,
      leveledUp: newLevel > user.level,
      loginStreak: updatedUser.loginStreak,
      totalLogins: updatedUser.totalLogins,
      streakBonus: newStreak >= 3,
      firstLoginToday: true,
    });
  } catch (error) {
    console.error("Error processing daily login:", error);
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        lastLoginDate: true,
        loginStreak: true,
        totalLogins: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const lastLoginDay = lastLogin
      ? new Date(
          lastLogin.getFullYear(),
          lastLogin.getMonth(),
          lastLogin.getDate()
        )
      : null;

    const canClaimToday =
      !lastLoginDay || lastLoginDay.getTime() < today.getTime();

    return NextResponse.json({
      canClaimToday,
      loginStreak: user.loginStreak,
      totalLogins: user.totalLogins,
      lastLoginDate: user.lastLoginDate,
    });
  } catch (error) {
    console.error("Error fetching daily login status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
