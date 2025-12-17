import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { groupId } = await context.params;

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
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

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { groupId } = await context.params;

    // Get the group to check ownership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    if (group.ownerId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete the group and all related data
    await prisma.group.delete({
      where: { id: groupId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting group:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
