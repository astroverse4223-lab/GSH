import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { emailService } from "../../../../../lib/email";

// This endpoint can be called by a cron job or background service
// to process pending data export requests
export async function POST() {
  try {
    // Get all pending export requests
    const pendingRequests = await prisma.dataExportRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 10, // Process max 10 at a time
    });

    console.log(`Processing ${pendingRequests.length} pending export requests`);

    const processedRequests = [];

    for (const request of pendingRequests) {
      try {
        // Mark as processing
        await prisma.dataExportRequest.update({
          where: { id: request.id },
          data: { status: "PROCESSING" },
        });

        // Simulate processing time (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Get user data for export
        const userData = await prisma.user.findUnique({
          where: { id: request.userId },
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

        // Generate export data
        const exportData = {
          exportedAt: new Date().toISOString(),
          profile: {
            id: userData?.id,
            name: userData?.name,
            email: userData?.email,
            bio: userData?.bio,
            createdAt: userData?.createdAt,
            lastSeen: userData?.lastSeen,
          },
          posts: userData?.posts || [],
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

        // In production, you'd upload this to cloud storage (AWS S3, Google Cloud, etc.)
        const mockDownloadUrl = `${process.env.NEXTAUTH_URL}/api/privacy/export/download/${request.id}`;
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update request as completed
        await prisma.dataExportRequest.update({
          where: { id: request.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            downloadUrl: mockDownloadUrl,
            expiresAt: expiryDate,
          },
        });

        // Send completion email
        if (request.user.email) {
          await emailService.sendDataExportReadyEmail(request.user.email, {
            userName: request.user.name || "User",
            downloadUrl: mockDownloadUrl,
            expiryDate: expiryDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            requestId: request.id,
          });
        }

        processedRequests.push({
          requestId: request.id,
          userId: request.userId,
          status: "completed",
        });

        console.log(
          `Successfully processed export request ${request.id} for user ${request.userId}`
        );
      } catch (requestError) {
        console.error(
          `Failed to process export request ${request.id}:`,
          requestError
        );

        // Mark as failed
        await prisma.dataExportRequest.update({
          where: { id: request.id },
          data: {
            status: "FAILED",
            processedAt: new Date(),
          },
        });

        processedRequests.push({
          requestId: request.id,
          userId: request.userId,
          status: "failed",
          error:
            requestError instanceof Error
              ? requestError.message
              : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedRequests.length} export requests`,
      processed: processedRequests,
    });
  } catch (error) {
    console.error("Error in background export processor:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const stats = await prisma.dataExportRequest.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    return NextResponse.json({
      message: "Export processor is running",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting export stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
