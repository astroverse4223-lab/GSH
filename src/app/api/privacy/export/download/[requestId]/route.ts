import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { requestId } = await params;

    // Find the export request
    const exportRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: requestId,
        userId: session.user.id, // Ensure user can only access their own exports
        status: "COMPLETED",
      },
      include: {
        user: true,
      },
    });

    if (!exportRequest) {
      return new NextResponse("Export not found or not ready", { status: 404 });
    }

    // Check if expired
    if (exportRequest.expiresAt && exportRequest.expiresAt < new Date()) {
      return new NextResponse("Download link has expired", { status: 410 });
    }

    // In production, this would fetch the file from cloud storage
    // For now, we'll regenerate the export data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        posts: {
          include: {
            comments: true,
            reactions: true,
          },
        },
        comments: true,
        reactions: true,
        friends: true,
        sentFriendRequests: true,
        receivedFriendRequests: true,
        privacySettings: true,
        blockingUsers: {
          include: {
            blocked: {
              select: { id: true, name: true },
            },
          },
        },
        blockedByUsers: {
          include: {
            blocker: {
              select: { id: true, name: true },
            },
          },
        },
        reportsSent: true,
        reportsReceived: true,
        listings: true,
        sentMessages: true,
        receivedMessages: true,
        subscription: true,
        boosts: true,
        transactions: true,
      },
    });

    const exportData = {
      exportedAt: exportRequest.processedAt?.toISOString(),
      requestId: exportRequest.id,
      profile: {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        bio: userData?.bio,
        createdAt: userData?.createdAt,
        lastSeen: userData?.lastSeen,
      },
      posts:
        userData?.posts?.map((post) => ({
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          comments: post.comments,
          reactions: post.reactions,
        })) || [],
      comments: userData?.comments || [],
      friends: userData?.friends || [],
      privacySettings: userData?.privacySettings,
      blockedUsers: userData?.blockingUsers || [],
      reports: userData?.reportsSent || [],
      marketplaceListings: userData?.listings || [],
      messages: userData?.sentMessages || [],
      subscription: userData?.subscription,
      transactions: userData?.transactions || [],
    };

    // Return as downloadable JSON file
    const filename = `gamer-social-export-${exportRequest.id}.json`;
    const jsonData = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error downloading export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
