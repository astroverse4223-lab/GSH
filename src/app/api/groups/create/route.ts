import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canUserCreateGroup } from "@/lib/subscription";
import { XP_REWARDS } from "@/lib/xp-system";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user can create groups (premium feature)
    const groupPermission = await canUserCreateGroup(session.user.id);
    if (!groupPermission.allowed) {
      return new NextResponse(
        JSON.stringify({ error: groupPermission.reason }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const imageFile = formData.get("image") as File;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/" +
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME +
          "/image/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file:
              "data:" + imageFile.type + ";base64," + buffer.toString("base64"),
            upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          }),
        }
      );

      const data = await response.json();
      imageUrl = data.secure_url;
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        image: imageUrl,
        category,
        owner: {
          connect: { id: session.user.id },
        },
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Award XP for creating a group
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true },
    });

    if (user) {
      const newXP = user.xp + XP_REWARDS.CREATE_GROUP;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
