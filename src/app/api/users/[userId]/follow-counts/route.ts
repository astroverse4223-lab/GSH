import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { userId } = await context.params;

    // Get friend counts
    const [followers, following] = await Promise.all([
      prisma.friend.count({
        where: {
          friendId: userId,
        },
      }),
      prisma.friend.count({
        where: {
          userId: userId,
        },
      }),
    ]);

    return NextResponse.json({
      followers,
      following,
    });
  } catch (error) {
    console.error("Error fetching follow counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow counts" },
      { status: 500 }
    );
  }
}
