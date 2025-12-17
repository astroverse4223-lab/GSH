import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Get user's stream info or all live streams
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (userId) {
      // Get specific user's stream
      const stream = await prisma.stream.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              twitchUsername: true,
              youtubeChannelId: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(stream);
    } else {
      // Get all live streams
      const streams = await prisma.stream.findMany({
        where: { isLive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              twitchUsername: true,
              youtubeChannelId: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(streams);
    }
  } catch (error) {
    console.error("Error fetching streams:", error);
    return NextResponse.json(
      { error: "Error fetching streams" },
      { status: 500 }
    );
  }
}

// Update or create stream
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, streamUrl, title, game, isLive } = await req.json();

    const stream = await prisma.stream.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform,
        },
      },
      update: {
        streamUrl,
        title,
        game,
        isLive,
        startedAt: isLive ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        platform,
        streamUrl,
        title,
        game,
        isLive,
        startedAt: isLive ? new Date() : null,
      },
    });

    return NextResponse.json(stream);
  } catch (error) {
    console.error("Error updating stream:", error);
    return NextResponse.json(
      { error: "Error updating stream" },
      { status: 500 }
    );
  }
}
