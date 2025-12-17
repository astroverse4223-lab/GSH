import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { userId } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        wallpaper: true,
        bannerImage: true,
        musicUrl: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      wallpaper: user.wallpaper,
      bannerImage: user.bannerImage,
      musicUrl: user.musicUrl,
    });
  } catch (error) {
    console.error("[USER_CUSTOMIZATION_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await context.params;
    const body = await request.json();
    const { wallpaper, bannerImage, musicUrl } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(wallpaper !== undefined && { wallpaper }),
        ...(bannerImage !== undefined && { bannerImage }),
        ...(musicUrl !== undefined && { musicUrl }),
      },
      select: {
        wallpaper: true,
        bannerImage: true,
        musicUrl: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_CUSTOMIZATION_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
