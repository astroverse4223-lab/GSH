import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        NOT: {
          id: session.user.id, // Exclude current user
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: 10, // Limit results
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USER_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
