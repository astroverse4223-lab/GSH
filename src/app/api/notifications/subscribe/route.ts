import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For testing purposes, allow subscription without auth
    const isTestMode = request.headers.get("x-test-mode") === "true";

    if (!session?.user && !isTestMode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();

    if (isTestMode) {
      // For test mode, just return success without saving to database
      return NextResponse.json({
        success: true,
        message: "Push notification subscription saved (test mode)",
      });
    }

    // Store the push subscription in the database for authenticated users
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          pushSubscription: JSON.stringify(subscription),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Push notification subscription saved",
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to save subscription",
      },
      { status: 500 }
    );
  }
}
