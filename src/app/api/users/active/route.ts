import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in active users route:", {
      exists: !!session,
      user: session?.user,
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find active users based on recent activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find users who were recently active
    const activeUsers = await prisma.user.findMany({
      where: {
        AND: [
          { name: { not: null } }, // Must have a name
          { id: { not: session.user.id } }, // Exclude current user
          {
            lastSeen: {
              gt: fiveMinutesAgo,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    console.log("Active users found:", activeUsers);
    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("[ACTIVE_USERS_GET]", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
