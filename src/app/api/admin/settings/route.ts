import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch platform settings
    let settings = await prisma.platformSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          siteName: "Gamer Social Site",
          registrationEnabled: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("Starting DELETE request");
    const data = await request.json();
    console.log("Request data:", data);

    if (!data.userId) {
      console.log("No userId provided");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate that userId is a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(data.userId)) {
      console.log("Invalid userId format:", data.userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    console.log("Looking up user:", data.userId);

    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      console.log("User not found:", data.userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user:", user);

    // Delete all related data in the correct order to handle foreign key constraints
    console.log("Starting transaction for user deletion");

    // Check relationships before starting the transaction
    const [postCount, commentCount, listingCount] = await Promise.all([
      prisma.post.count({ where: { userId: data.userId } }),
      prisma.comment.count({ where: { userId: data.userId } }),
      prisma.marketplaceListing.count({ where: { sellerId: data.userId } }),
    ]);

    console.log("Found relationships:", {
      posts: postCount,
      comments: commentCount,
      listings: listingCount,
    });

    // Use a try/catch inside the transaction to get more specific error information
    await prisma.$transaction(async (tx) => {
      try {
        console.log("Starting user deletion process for userId:", data.userId);

        // Function to safely delete with logging
        const safeDelete = async (
          model: any,
          whereCondition: any,
          description: string
        ) => {
          try {
            await model.deleteMany({ where: whereCondition });
            console.log(`✓ ${description} deleted successfully`);
          } catch (error) {
            console.error(`✗ Error deleting ${description}:`, error);
            throw error;
          }
        };

        // 1. Delete reports
        await safeDelete(
          tx.report,
          {
            OR: [{ reporterId: data.userId }, { reportedUserId: data.userId }],
          },
          "Reports"
        );

        // 2. Delete marketplace data
        await safeDelete(
          tx.marketplaceTransaction,
          {
            OR: [{ buyerId: data.userId }, { sellerId: data.userId }],
          },
          "Marketplace transactions"
        );

        await safeDelete(
          tx.marketplaceListing,
          {
            sellerId: data.userId,
          },
          "Marketplace listings"
        );

        // 3. Delete social interactions
        await safeDelete(
          tx.commentReaction,
          {
            userId: data.userId,
          },
          "Comment reactions"
        );

        await safeDelete(
          tx.comment,
          {
            userId: data.userId,
          },
          "Comments"
        );

        await safeDelete(
          tx.postReaction,
          {
            userId: data.userId,
          },
          "Post reactions"
        );

        await safeDelete(
          tx.post,
          {
            userId: data.userId,
          },
          "Posts"
        );

        // 4. Delete relationships
        await safeDelete(
          tx.friendRequest,
          {
            OR: [{ senderId: data.userId }, { receiverId: data.userId }],
          },
          "Friend requests"
        );

        await safeDelete(
          tx.friend,
          {
            OR: [{ userId: data.userId }, { friendId: data.userId }],
          },
          "Friends"
        );

        // 5. Delete notifications and social connections
        await safeDelete(
          tx.notification,
          {
            OR: [{ userId: data.userId }, { senderId: data.userId }],
          },
          "Notifications"
        );

        await safeDelete(
          tx.follows,
          {
            OR: [{ followerId: data.userId }, { followingId: data.userId }],
          },
          "Follows"
        );

        await safeDelete(
          tx.blockedUser,
          {
            OR: [{ blockerId: data.userId }, { blockedId: data.userId }],
          },
          "Blocked users"
        );

        // 6. Delete user content
        await safeDelete(
          tx.media,
          {
            userId: data.userId,
          },
          "Media"
        );

        await safeDelete(
          tx.stream,
          {
            userId: data.userId,
          },
          "Streams"
        );

        await safeDelete(
          tx.gameHighScore,
          {
            userId: data.userId,
          },
          "Game high scores"
        );

        await safeDelete(
          tx.gamePlayer,
          {
            userId: data.userId,
          },
          "Game players"
        );

        // 7. Delete subscription and settings
        await safeDelete(
          tx.subscription,
          {
            userId: data.userId,
          },
          "Subscription"
        );

        await safeDelete(
          tx.userPrivacySettings,
          {
            userId: data.userId,
          },
          "Privacy settings"
        );

        await safeDelete(
          tx.accountDeletionRequest,
          {
            userId: data.userId,
          },
          "Account deletion requests"
        );

        // 8. Delete auth data
        await safeDelete(
          tx.account,
          {
            userId: data.userId,
          },
          "Account"
        );

        await safeDelete(
          tx.session,
          {
            userId: data.userId,
          },
          "Sessions"
        );

        // Finally delete the user
        await tx.user.delete({
          where: { id: data.userId },
        });
      } catch (err) {
        console.error("Error in transaction:", err);
        if (err instanceof Error) {
          console.error("Transaction error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }
        throw err;
      }
    });

    console.log("Transaction completed successfully");
    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully",
      userId: data.userId,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    // Log the full error details
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.siteName) {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 }
      );
    }

    // Update platform settings (if not exists, create)
    let updated;
    const existing = await prisma.platformSettings.findFirst();

    // Process security settings
    if (data.security && typeof data.security === "object") {
      data.security = JSON.stringify(data.security);
    }

    if (existing) {
      // Extract only the fields we want to update
      const { id, createdAt, ...updateData } = data;
      updated = await prisma.platformSettings.update({
        where: { id: existing.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    } else {
      updated = await prisma.platformSettings.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
