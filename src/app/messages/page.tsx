import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";
import { prisma } from "@/lib/prisma";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  try {
    // Verify prisma is defined
    if (!prisma) {
      throw new Error("Prisma client is not initialized");
    }

    // Get user's friends
    const friends = await prisma.friend.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
      },
    });

    // Get all conversations for the user
    const conversations =
      (await prisma.conversation.findMany({
        where: {
          participantIds: {
            has: session.user.id,
          },
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      })) || [];

    interface Friend {
      friend: {
        id: string;
        name: string | null;
        image: string | null;
        lastSeen: Date | null;
      };
    }

    // Format the friends data to handle Date objects
    const formattedFriends = friends.map((f: Friend) => ({
      ...f.friend,
      lastSeen: f.friend.lastSeen ? new Date(f.friend.lastSeen) : null,
    }));

    return (
      <div className="container mx-auto px-4 py-8">
        <MessagesClient
          initialConversations={conversations}
          currentUserId={session.user.id}
          friends={formattedFriends}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading messages:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-red-500">
          Error loading messages. Please try again later.
        </h2>
      </div>
    );
  }
}
