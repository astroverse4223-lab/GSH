import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { emailService } from "../../../../lib/email";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if there's already a pending or processing request
    const existingRequest = await prisma.dataExportRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (existingRequest) {
      return new NextResponse("A data export request is already in progress", {
        status: 409,
      });
    }

    // Create new export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId: session.user.id,
      },
    });

    // Mark user privacy settings as requesting export
    await prisma.userPrivacySettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dataExportRequested: true,
      },
      update: {
        dataExportRequested: true,
      },
    });

    // Get user data for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Send confirmation email
    if (user?.email) {
      try {
        await emailService.sendDataExportRequestConfirmation(
          user.email,
          user.name || "User",
          exportRequest.id
        );
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message:
        "Data export requested successfully. You'll receive an email confirmation shortly, and another email when your export is ready for download.",
      requestId: exportRequest.id,
    });
  } catch (error) {
    console.error("Error requesting data export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const exportRequests = await prisma.dataExportRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(exportRequests);
  } catch (error) {
    console.error("Error fetching data export requests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// For testing purposes - generate actual export data
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { requestId } = await request.json();

    // Get the export request
    const exportRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: requestId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (!exportRequest) {
      return new NextResponse("Export request not found", { status: 404 });
    }

    // Collect all user data
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

    // Generate export data (in a real app, this would be uploaded to cloud storage)
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

    // For demo purposes, we'll just return the data
    // In production, you'd upload to cloud storage and provide a download URL
    const mockDownloadUrl = `https://exports.yourdomain.com/export-${requestId}.json`;
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update the export request
    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        downloadUrl: mockDownloadUrl,
        expiresAt: expiryDate,
      },
    });

    // Send completion email with download link
    if (userData?.email) {
      try {
        await emailService.sendDataExportReadyEmail(userData.email, {
          userName: userData.name || "User",
          downloadUrl: mockDownloadUrl,
          expiryDate: expiryDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          requestId: requestId,
        });
      } catch (emailError) {
        console.error("Failed to send completion email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message:
        "Data export completed successfully! Check your email for the download link.",
      downloadUrl: mockDownloadUrl,
      data: exportData, // In production, don't include this
    });
  } catch (error) {
    console.error("Error processing data export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
