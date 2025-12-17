import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove the push subscription from the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushSubscription: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Push notification subscription removed",
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to remove subscription",
      },
      { status: 500 }
    );
  }
}
