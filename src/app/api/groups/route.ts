import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit");

    const whereClause = category && category !== "all" ? { category } : {};

    const groups = await prisma.group.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: true,
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      orderBy:
        sort === "popular"
          ? { members: { _count: "desc" } }
          : { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return new NextResponse("Error fetching groups", { status: 500 });
  }
}
