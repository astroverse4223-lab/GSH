import { prisma } from "./prisma";

export async function saveHighScore(
  userId: string,
  game: string,
  score: number
) {
  try {
    // Check if user already has a high score for this game
    const existingScore = await prisma.gameHighScore.findFirst({
      where: {
        userId,
        game,
      },
    });

    if (!existingScore || score > existingScore.score) {
      // Create or update high score
      await prisma.gameHighScore.upsert({
        where: {
          userId_game: {
            userId,
            game,
          },
        },
        update: {
          score,
          updatedAt: new Date(),
        },
        create: {
          userId,
          game,
          score,
        },
      });

      return { isNewHighScore: true, score };
    }

    return { isNewHighScore: false, score: existingScore.score };
  } catch (error) {
    console.error("Error saving high score:", error);
    throw error;
  }
}

export async function getHighScores(game: string, limit: number = 10) {
  try {
    const highScores = await prisma.gameHighScore.findMany({
      where: { game },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return highScores;
  } catch (error) {
    console.error("Error fetching high scores:", error);
    throw error;
  }
}

export async function getUserHighScore(userId: string, game: string) {
  try {
    const highScore = await prisma.gameHighScore.findFirst({
      where: {
        userId,
        game,
      },
    });

    return highScore?.score || 0;
  } catch (error) {
    console.error("Error fetching user high score:", error);
    return 0;
  }
}
