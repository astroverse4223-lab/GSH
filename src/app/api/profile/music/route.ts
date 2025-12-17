import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        musicUrl: true,
      },
    });

    return NextResponse.json({ musicUrl: user?.musicUrl || null });
  } catch (error) {
    console.error("[MUSIC_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[MUSIC_UPDATE_ERROR] No session or user ID");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { musicUrl } = body;

    console.log("[MUSIC_UPDATE] Updating music URL for user:", session.user.id);
    console.log("[MUSIC_UPDATE] New music URL:", musicUrl);

    // Validate musicUrl if provided
    if (musicUrl && typeof musicUrl !== "string") {
      console.error(
        "[MUSIC_UPDATE_ERROR] Invalid musicUrl type:",
        typeof musicUrl
      );
      return new NextResponse("Invalid music URL", { status: 400 });
    }

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        musicUrl: musicUrl || null,
      },
    });

    console.log("[MUSIC_UPDATE] Successfully updated music URL");
    return NextResponse.json(user);
  } catch (error) {
    console.error("[MUSIC_UPDATE_ERROR] Full error:", error);
    if (error instanceof Error) {
      console.error("[MUSIC_UPDATE_ERROR] Error message:", error.message);
      console.error("[MUSIC_UPDATE_ERROR] Error stack:", error.stack);
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
