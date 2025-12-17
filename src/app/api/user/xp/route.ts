import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure consistent level calculation based on XP
    const calculatedLevel = Math.floor(user.xp / 1000) + 1;
    const actualLevel = Math.max(user.level, calculatedLevel);

    // Calculate XP for current level (each level needs 1000 XP)
    const currentLevelXP = (actualLevel - 1) * 1000;
    const xpInCurrentLevel = Math.max(0, user.xp - currentLevelXP);
    const xpForNextLevel = 1000; // Always 1000 XP needed to complete current level
    const xpNeededForNext = xpForNextLevel - xpInCurrentLevel;

    return NextResponse.json({
      xp: user.xp,
      level: actualLevel,
      xpInCurrentLevel,
      xpNeededForNext,
      xpForNextLevel,
    });
  } catch (error) {
    console.error("Error fetching user XP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xp: newXP,
        level: newLevel,
      },
      select: {
        xp: true,
        level: true,
      },
    });

    return NextResponse.json({
      xp: updatedUser.xp,
      level: updatedUser.level,
      leveledUp: newLevel > user.level,
      xpGained: amount,
    });
  } catch (error) {
    console.error("Error updating user XP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
