import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canUserJoinGroup } from "@/lib/subscription";
import { XP_REWARDS } from "@/lib/xp-system";

type Context = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(request: NextRequest, context: Context) {
  const { groupId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check subscription limits for joining groups
    const joinPermission = await canUserJoinGroup(session.user.id);
    if (!joinPermission.allowed) {
      return new NextResponse(
        JSON.stringify({ error: joinPermission.reason }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return new NextResponse("Already a member", { status: 400 });
    }

    // Add user as a member
    const member = await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: session.user.id,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Award XP for joining a group
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true },
    });

    if (user) {
      const newXP = user.xp + XP_REWARDS.JOIN_GROUP;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error joining group:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
