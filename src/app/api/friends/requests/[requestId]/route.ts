import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/index";

// Remove edge runtime to use Node.js APIs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action } = await request.json();
    const requestId = request.nextUrl.pathname.split("/").pop();

    if (!action || !requestId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
        receiver: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!friendRequest) {
      return new NextResponse("Friend request not found", { status: 404 });
    }

    if (friendRequest.receiverId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (action === "ACCEPT") {
      // Create friend connections for both users
      await prisma.$transaction([
        prisma.friend.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
        prisma.friend.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
      ]);

      // Create notification for the sender that their request was accepted
      await createNotification({
        userId: friendRequest.senderId,
        senderId: session.user.id,
        type: "FRIEND_REQUEST",
        content: `${friendRequest.receiver.name} accepted your friend request`,
        link: `/users/${session.user.id}`,
      });

      return NextResponse.json({ status: "ACCEPTED" });
    } else if (action === "REJECT") {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ status: "REJECTED" });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("[FRIEND_REQUEST_RESPONSE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
