import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { XP_REWARDS } from "@/lib/xp-system";

export async function GET() {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, description, price, condition, category, images, userId } =
      data;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        title,
        description,
        price,
        condition,
        category,
        seller: {
          connect: { id: userId },
        },
        images: {
          create: images.map((url: string) => ({ url })),
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
      },
    });

    // Award XP for listing an item
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (user) {
      const newXP = user.xp + XP_REWARDS.LIST_ITEM;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
