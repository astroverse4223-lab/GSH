import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "xp";
    const game = searchParams.get("game");

    if (type === "xp") {
      // Get XP leaderboard using xp field name
      const xpLeaders = await prisma.user.findMany({
        where: {
          xp: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          xp: true,
          level: true,
        },
        orderBy: {
          xp: "desc",
        },
        take: 50,
      });

      // Transform to match expected interface
      const leadersWithXP = xpLeaders.map((user) => ({
        ...user,
        username: user.email?.split("@")[0] || "Unknown",
      }));

      return NextResponse.json(leadersWithXP);
    } else if (type === "games") {
      // Get game high scores
      let whereClause: any = {};

      if (game && game !== "all") {
        whereClause.game = game;
      }

      const gameScores = await prisma.gameHighScore.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          score: "desc",
        },
        take: 50,
      });

      // Add username field from email
      const scoresWithUsername = gameScores.map((score) => ({
        ...score,
        user: {
          ...score.user,
          username: score.user.email?.split("@")[0] || "Unknown",
        },
      }));

      return NextResponse.json(scoresWithUsername);
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboards" },
      { status: 500 }
    );
  }
}
