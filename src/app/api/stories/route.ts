import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stories from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        views: {
          where: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mark stories as viewed/unviewed for the current user
    const storiesWithViewStatus = stories.map((story) => ({
      ...story,
      isViewed: story.views.length > 0,
      views: undefined, // Remove views from response for privacy
    }));

    return NextResponse.json(storiesWithViewStatus);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, type, gameTitle, status, mediaUrl } = body;

    if (!content && !gameTitle) {
      return NextResponse.json(
        { error: "Content or game title is required" },
        { status: 400 }
      );
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        userId: session.user.id,
        content:
          content ||
          `${
            status === "playing"
              ? "🎮"
              : status === "completed"
              ? "🏆"
              : status === "streaming"
              ? "📺"
              : "👥"
          } ${gameTitle}`,
        type: type || "text",
        gameTitle,
        status,
        mediaUrl,
        expiresAt,
      },
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

    return NextResponse.json(story);
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Mark story as viewed by creating a view record
    await prisma.storyView.upsert({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        storyId,
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking story as viewed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
