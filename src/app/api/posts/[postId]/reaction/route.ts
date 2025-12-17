import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/index";

type ReactionCount = {
  emoji: string;
  _count: {
    _all: number;
  };
};

function getReactionMessage(emoji: string, isChange: boolean = false): string {
  const messages = {
    "🔥": isChange
      ? "thinks your post is on fire now! 🔥"
      : "thinks your post is fire! 🔥",
    "🎮": isChange
      ? "changed their reaction to GG - well played! 🎮"
      : "gave your post a GG! Good game! 🎮",
    "💀": isChange
      ? "now thinks your post killed it! 💀"
      : "thinks your post killed it! 💀",
    "😂": isChange
      ? "is now cracking up at your post! 😂"
      : "found your post hilarious! 😂",
  };

  return messages[emoji as keyof typeof messages] || `reacted with ${emoji}`;
}

type Context = {
  params: Promise<{ postId: string }>;
};

export async function POST(req: Request, context: Context) {
  try {
    // Get all async operations in parallel
    const [session, { emoji }, params] = await Promise.all([
      getServerSession(authOptions),
      req.json(),
      Promise.resolve(context.params),
    ]);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const { postId } = params;

    // Check if user has already reacted to this post
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let reaction;
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // If same emoji, remove the reaction
        await prisma.postReaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        // If different emoji, update the reaction and notify
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        });

        if (!post) {
          return new NextResponse("Post not found", { status: 404 });
        }

        reaction = await prisma.postReaction.update({
          where: {
            id: existingReaction.id,
          },
          data: {
            emoji,
          },
        });

        // Create notification for post owner if they're not the one reacting
        if (post.userId !== userId) {
          await prisma.notification.create({
            data: {
              type: "POST_REACTION",
              content: getReactionMessage(emoji, true),
              userId: post.userId,
              senderId: userId,
              postId,
            },
          });

          // Send push notification for reaction change
          try {
            await createNotification({
              userId: post.userId,
              senderId: userId,
              type: "POST_LIKE",
              content: getReactionMessage(emoji, true),
              link: `/post/${postId}`,
              postId,
            });
          } catch (notificationError) {
            console.error(
              "Error sending reaction change notification:",
              notificationError
            );
          }
        }
      }
    } else {
      // Get post details to check the post owner
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      });

      if (!post) {
        return new NextResponse("Post not found", { status: 404 });
      }

      // Create new reaction
      reaction = await prisma.postReaction.create({
        data: {
          emoji,
          userId,
          postId,
        },
      });

      // Create notification for post owner if they're not the one reacting
      if (post.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: "POST_REACTION",
            content: getReactionMessage(emoji),
            userId: post.userId, // Send to post owner
            senderId: userId, // From the person who reacted
            postId, // Link to the post
          },
        });

        // Send push notification
        try {
          await createNotification({
            userId: post.userId,
            senderId: userId,
            type: "POST_LIKE",
            content: getReactionMessage(emoji),
            link: `/post/${postId}`,
            postId,
          });
        } catch (notificationError) {
          console.error(
            "Error sending reaction notification:",
            notificationError
          );
        }
      }
    }

    // Get updated reaction counts
    const reactionCounts = await prisma.postReaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: {
        _all: true,
      },
    });

    // Format reaction counts with emoji keys
    const formattedCounts = {
      "🔥":
        reactionCounts.find((r: ReactionCount) => r.emoji === "🔥")?._count
          ._all || 0,
      "🎮":
        reactionCounts.find((r: ReactionCount) => r.emoji === "🎮")?._count
          ._all || 0,
      "💀":
        reactionCounts.find((r: ReactionCount) => r.emoji === "💀")?._count
          ._all || 0,
      "😂":
        reactionCounts.find((r: ReactionCount) => r.emoji === "😂")?._count
          ._all || 0,
    };

    return NextResponse.json({
      reactionCounts: formattedCounts,
      userReaction: reaction ? emoji : null,
    });
  } catch (error) {
    console.error("Error handling reaction:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
