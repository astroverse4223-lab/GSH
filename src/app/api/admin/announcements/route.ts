import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession();

  // Check if user is admin
  if (
    !session?.user?.email ||
    session.user.email !== "countryboya20@gmail.com"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  let whereClause: any = {};
  const now = new Date();

  switch (filter) {
    case "active":
      whereClause = {
        active: true,
        startDate: { lte: now },
        // Note: Since all current announcements have endDate: null,
        // we'll omit the endDate check for now
      };
      break;
    case "scheduled":
      whereClause = {
        startDate: { gt: now },
      };
      break;
    case "expired":
      whereClause = {
        endDate: {
          not: null,
          lt: now,
        },
      };
      break;
    default:
      // 'all' - no additional filters
      break;
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  // Check if user is admin
  if (
    !session?.user?.email ||
    session.user.email !== "countryboya20@gmail.com"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      title,
      content,
      type,
      priority,
      startDate,
      endDate,
      targetAudience,
    } = await request.json();

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || "GENERAL",
        priority: priority || 0,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        targetAudience: targetAudience || ["ALL"],
        active: true,
        viewCount: 0,
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession();

  // Check if user is admin
  if (
    !session?.user?.email ||
    session.user.email !== "countryboya20@gmail.com"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      id,
      title,
      content,
      type,
      priority,
      startDate,
      endDate,
      targetAudience,
    } = await request.json();

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        type: type || "GENERAL",
        priority: priority || 0,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        targetAudience: targetAudience || ["ALL"],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
