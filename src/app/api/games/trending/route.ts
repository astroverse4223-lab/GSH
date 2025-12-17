import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTrendingSteamGames } from "@/lib/steam";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get trending games from Steam
    const steamGames = await getTrendingSteamGames();

    // Find or create these games in our database and get player status
    const games = await Promise.all(
      steamGames.map(async (steamGame) => {
        // Find or create the game
        const game = await prisma.game.upsert({
          where: { steamId: steamGame.id.toString() },
          update: {
            playerCount: steamGame.current_players,
            imageUrl: steamGame.image_url,
          },
          create: {
            steamId: steamGame.id.toString(),
            name: steamGame.name,
            playerCount: steamGame.current_players,
            imageUrl: steamGame.image_url,
          },
        });

        // Check if the current user is playing
        const userGameStatus = userId
          ? await prisma.gamePlayer.findFirst({
              where: {
                userId,
                gameId: game.id,
                endTime: null,
              },
            })
          : null;

        return {
          ...game,
          current_players: steamGame.current_players,
          peak_today: steamGame.peak_today,
          image_url: game.imageUrl || steamGame.image_url,
          steamPlayers: steamGame.current_players,
          peakToday: steamGame.peak_today,
          isPlaying: !!userGameStatus,
          _count: {
            activePlayers: await prisma.gamePlayer.count({
              where: {
                gameId: game.id,
                endTime: null,
              },
            }),
          },
        };
      })
    );

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching trending games:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending games" },
      { status: 500 }
    );
  }
}
