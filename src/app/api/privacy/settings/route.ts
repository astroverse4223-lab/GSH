import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let privacySettings = await prisma.userPrivacySettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no privacy settings exist, create default ones
    if (!privacySettings) {
      privacySettings = await prisma.userPrivacySettings.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(privacySettings);
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Validate the data
    const allowedFields = [
      "profileVisibility",
      "showEmail",
      "showLastSeen",
      "allowFriendRequests",
      "allowMessages",
      "allowGroupInvites",
      "marketplaceNotifications",
      "postNotifications",
      "friendNotifications",
      "emailNotifications",
      "pushNotifications",
      "twoFactorEnabled",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = data[field];
      }
    }

    const privacySettings = await prisma.userPrivacySettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json(privacySettings);
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
