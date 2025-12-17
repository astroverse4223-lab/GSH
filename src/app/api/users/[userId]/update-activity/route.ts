import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);

    // If no session, just return success - no need to update activity for anonymous users
    if (!session?.user) {
      return NextResponse.json({ status: "ok" });
    }

    const { userId } = await context.params;

    // Only allow users to update their own activity
    if (session.user.id !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if user exists before updating
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ status: "ok" });
    }

    const now = new Date();

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastSeen: now,
      },
      select: {
        id: true,
      },
    });

    return new NextResponse("OK");
  } catch (error) {
    console.error("[UPDATE_ACTIVITY_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
