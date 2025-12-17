import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { emailService } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reason } = await request.json();

    // Check if there's already a pending deletion request
    const existingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return new NextResponse(
        "An account deletion request is already pending",
        { status: 409 }
      );
    }

    // Create deletion request (scheduled for 30 days from now)
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);

    const deletionRequest = await prisma.accountDeletionRequest.create({
      data: {
        userId: session.user.id,
        scheduledFor,
        reason: reason || null,
      },
    });

    // Mark user privacy settings as requesting deletion
    await prisma.userPrivacySettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        accountDeletionRequested: true,
      },
      update: {
        accountDeletionRequested: true,
      },
    });

    // Get user data for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Send deletion scheduled email
    if (user?.email) {
      try {
        await emailService.sendAccountDeletionScheduledEmail(
          user.email,
          user.name || "User",
          scheduledFor.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          deletionRequest.id
        );
      } catch (emailError) {
        console.error("Failed to send deletion scheduled email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message:
        "Account deletion scheduled successfully. Check your email for important information about the 30-day grace period.",
      scheduledFor,
      requestId: deletionRequest.id,
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { requestId } = await request.json();

    // Cancel the deletion request
    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (!deletionRequest) {
      return new NextResponse("Deletion request not found", { status: 404 });
    }

    // Update request status
    await prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    // Update privacy settings
    await prisma.userPrivacySettings.update({
      where: { userId: session.user.id },
      data: { accountDeletionRequested: false },
    });

    // Get user data for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Send cancellation confirmation email
    if (user?.email) {
      try {
        await emailService.sendAccountDeletionCancelledEmail(
          user.email,
          user.name || "User"
        );
      } catch (emailError) {
        console.error("Failed to send deletion cancelled email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message:
        "Account deletion request cancelled successfully. Check your email for confirmation.",
    });
  } catch (error) {
    console.error("Error cancelling account deletion:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deletionRequests = await prisma.accountDeletionRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(deletionRequests);
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// For testing/admin purposes - actually delete an account
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { requestId, confirmDeletion } = await request.json();

    if (!confirmDeletion) {
      return new NextResponse("Confirmation required", { status: 400 });
    }

    // Find the deletion request
    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (!deletionRequest) {
      return new NextResponse("Deletion request not found", { status: 404 });
    }

    // For safety, let's not actually delete the account in this demo
    // Instead, just mark it as completed
    await prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({
      message:
        "Account deletion processed. (In demo mode - account not actually deleted)",
    });

    // In production, you would:
    // 1. Delete all user data
    // 2. Anonymize posts/comments instead of deleting them
    // 3. Delete the user record
    // 4. Invalidate all sessions
    // 5. Send confirmation email
  } catch (error) {
    console.error("Error processing account deletion:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
