import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    const { image, bannerImage, bio, wallpaper } = data;

    // Create update data object, handling bio specially to allow empty strings
    const updateData: any = {};
    if (image !== undefined) updateData.image = image;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (wallpaper !== undefined) updateData.wallpaper = wallpaper;
    if (bio !== undefined) updateData.bio = bio; // Allow empty string for bio

    console.log("Update request data:", updateData); // Debug incoming data

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bannerImage: true,
        wallpaper: true,
        bio: true,
      },
    });

    console.log("Updated user:", updatedUser); // Debug response
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
