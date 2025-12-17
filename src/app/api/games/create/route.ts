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

    const { name, imageUrl, description } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    // Create or update the game
    const game = await prisma.game.upsert({
      where: { name },
      update: {
        imageUrl,
        description,
        lastUpdated: new Date(),
      },
      create: {
        name,
        imageUrl,
        description,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating/updating game:", error);
    return NextResponse.json(
      { error: "Failed to create/update game" },
      { status: 500 }
    );
  }
}
