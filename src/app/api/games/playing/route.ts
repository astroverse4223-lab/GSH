import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId, action } = await request.json();

    if (!gameId || !action || !["start", "stop"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Provide gameId and action (start/stop)" },
        { status: 400 }
      );
    }

    // Find the game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (action === "start") {
      // Check if user is already playing this game
      const existingSession = await prisma.gamePlayer.findFirst({
        where: {
          userId: session.user.id,
          gameId,
          endTime: null,
        },
      });

      if (existingSession) {
        return NextResponse.json(
          { error: "Already playing this game" },
          { status: 400 }
        );
      }

      // Start playing
      await prisma.$transaction([
        prisma.gamePlayer.create({
          data: {
            gameId,
            userId: session.user.id,
          },
        }),
        prisma.game.update({
          where: { id: gameId },
          data: {
            playerCount: {
              increment: 1,
            },
          },
        }),
      ]);
    } else {
      // Stop playing
      const gameSession = await prisma.gamePlayer.findFirst({
        where: {
          userId: session.user.id,
          gameId,
          endTime: null,
        },
      });

      if (!gameSession) {
        return NextResponse.json(
          { error: "Not currently playing this game" },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.gamePlayer.update({
          where: { id: gameSession.id },
          data: { endTime: new Date() },
        }),
        prisma.game.update({
          where: { id: gameId },
          data: {
            playerCount: {
              decrement: 1,
            },
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating game status:", error);
    return NextResponse.json(
      { error: "Failed to update game status" },
      { status: 500 }
    );
  }
}
