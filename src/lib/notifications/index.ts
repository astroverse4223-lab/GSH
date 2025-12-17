import { prisma } from "../prisma";

export async function createNotification({
  userId,
  senderId,
  type,
  content,
  link,
  postId,
  messageId,
  gameId,
}: {
  userId: string;
  senderId: string;
  type:
    | "MESSAGE"
    | "POST_LIKE"
    | "POST_COMMENT"
    | "FRIEND_REQUEST"
    | "GAME_PLAYING";
  content: string;
  link?: string;
  postId?: string;
  messageId?: string;
  gameId?: string;
}) {
  try {
    // Create database notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        senderId,
        type,
        content,
        link,
        postId,
        messageId,
        gameId,
      },
    });

    // Also send push notification if user has a subscription
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushSubscription: true, name: true },
      });

      if (targetUser?.pushSubscription) {
        // Get sender info for better notification content
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
          select: { name: true },
        });

        // Create push notification title and body based on type
        let title = "New Notification";
        let body = content;

        switch (type) {
          case "FRIEND_REQUEST":
            title = "New Friend Request";
            body = `${sender?.name || "Someone"} sent you a friend request`;
            break;
          case "POST_COMMENT":
            title = "New Comment";
            body = `${sender?.name || "Someone"} commented on your post`;
            break;
          case "POST_LIKE":
            title = "Post Reaction";
            body = `${sender?.name || "Someone"} reacted to your post`;
            break;
          case "MESSAGE":
            title = "New Message";
            body = `${sender?.name || "Someone"} sent you a message`;
            break;
          default:
            title = "Gaming Buddy";
            body = content;
        }

        // Send push notification via API
        await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/notifications/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId,
              title: title,
              body: body,
              url: link || "/",
            }),
          }
        );
      }
    } catch (pushError) {
      // Don't fail the whole notification if push fails
      console.log("Push notification failed (not critical):", pushError);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    });
    return true;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return false;
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
    return count;
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    return 0;
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
        message: true,
        game: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });
    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return [];
  }
}
