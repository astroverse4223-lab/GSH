import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { sendReportEmail } from "../../../../lib/email";

// Helper functions to extract target information
function getTargetName(report: any): string {
  if (report.reportedUser) return report.reportedUser.name || "Unknown User";
  if (report.reportedPost)
    return `Post: ${report.reportedPost.content.substring(0, 50)}...`;
  if (report.reportedComment)
    return `Comment: ${report.reportedComment.content.substring(0, 50)}...`;
  if (report.reportedListing)
    return report.reportedListing.title || "Unknown Listing";
  return "Unknown Item";
}

function getTargetId(report: any): string {
  return (
    report.reportedUserId ||
    report.reportedPostId ||
    report.reportedCommentId ||
    report.reportedListingId ||
    "Unknown"
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      type,
      category,
      description,
      reportedUserId,
      reportedPostId,
      reportedCommentId,
      reportedListingId,
    } = await request.json();

    // Validate required fields
    if (!type || !category || !description) {
      return new NextResponse("Type, category, and description are required", {
        status: 400,
      });
    }

    // Validate type
    const validTypes = ["USER", "POST", "COMMENT", "LISTING"];
    if (!validTypes.includes(type)) {
      return new NextResponse("Invalid report type", { status: 400 });
    }

    // Validate category
    const validCategories = [
      "SPAM",
      "HARASSMENT",
      "INAPPROPRIATE_CONTENT",
      "SCAM",
      "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return new NextResponse("Invalid report category", { status: 400 });
    }

    // Validate that appropriate ID is provided based on type
    const reportData: any = {
      reporterId: session.user.id,
      type,
      category,
      description: description.trim(),
    };

    switch (type) {
      case "USER":
        if (!reportedUserId) {
          return new NextResponse("User ID is required for user reports", {
            status: 400,
          });
        }
        if (reportedUserId === session.user.id) {
          return new NextResponse("Cannot report yourself", { status: 400 });
        }
        reportData.reportedUserId = reportedUserId;
        break;
      case "POST":
        if (!reportedPostId) {
          return new NextResponse("Post ID is required for post reports", {
            status: 400,
          });
        }
        reportData.reportedPostId = reportedPostId;
        break;
      case "COMMENT":
        if (!reportedCommentId) {
          return new NextResponse(
            "Comment ID is required for comment reports",
            {
              status: 400,
            }
          );
        }
        reportData.reportedCommentId = reportedCommentId;
        break;
      case "LISTING":
        if (!reportedListingId) {
          return new NextResponse(
            "Listing ID is required for listing reports",
            {
              status: 400,
            }
          );
        }
        reportData.reportedListingId = reportedListingId;
        break;
    }

    // Check if user has already reported this item
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        ...(reportedUserId && { reportedUserId }),
        ...(reportedPostId && { reportedPostId }),
        ...(reportedCommentId && { reportedCommentId }),
        ...(reportedListingId && { reportedListingId }),
      },
    });

    if (existingReport) {
      return new NextResponse("You have already reported this item", {
        status: 409,
      });
    }

    // Create the report
    const report = await prisma.report.create({
      data: reportData,
    });

    // Fetch the report with related data for email
    const fullReport = await prisma.report.findUnique({
      where: { id: report.id },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reportedUser: {
          select: { id: true, name: true },
        },
        reportedPost: {
          select: { id: true, content: true },
        },
        reportedComment: {
          select: { id: true, content: true },
        },
      },
    });

    // Send email notification
    if (fullReport) {
      try {
        console.log("Attempting to send report email...");
        await sendReportEmail({
          reportId: fullReport.id,
          reporterName: fullReport.reporter.name || "Anonymous",
          reporterEmail: fullReport.reporter.email || "",
          type: fullReport.type,
          category: fullReport.category,
          description: fullReport.description,
          targetName: getTargetName(fullReport),
          targetId: getTargetId(fullReport),
        });
        console.log("Report email sent successfully");
      } catch (emailError) {
        console.error("Failed to send report email:", emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      message: "Report submitted successfully",
      reportId: report.id,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get reports sent by the user
    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id },
      include: {
        reportedUser: {
          select: { id: true, name: true, image: true },
        },
        reportedPost: {
          select: { id: true, content: true },
        },
        reportedComment: {
          select: { id: true, content: true },
        },
        reportedListing: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
