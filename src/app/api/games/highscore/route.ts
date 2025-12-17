import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { game, score } = body;

    // Get current high score
    const existingScore = await prisma.gameHighScore.findUnique({
      where: {
        userId_game: {
          userId: session.user.id,
          game,
        },
      },
    });

    // Only update if this is a new high score
    if (!existingScore || score > existingScore.score) {
      const highScore = await prisma.gameHighScore.upsert({
        where: {
          userId_game: {
            userId: session.user.id,
            game,
          },
        },
        update: {
          score,
        },
        create: {
          userId: session.user.id,
          game,
          score,
        },
      });

      return NextResponse.json(highScore);
    }

    return NextResponse.json(existingScore);
  } catch (error) {
    console.error("[GAME_HIGHSCORE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game");

    if (!game) {
      return new NextResponse("Game parameter is required", { status: 400 });
    }

    const highScore = await prisma.gameHighScore.findUnique({
      where: {
        userId_game: {
          userId: session.user.id,
          game,
        },
      },
    });

    return NextResponse.json(highScore || { score: 0 });
  } catch (error) {
    console.error("[GAME_HIGHSCORE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
