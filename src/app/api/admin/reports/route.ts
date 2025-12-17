import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

// Check if user is admin
async function isAdmin(session: any) {
  if (!session?.user?.email) return false;
  // You can modify this to check a database field or use your own admin logic
  return session.user.email === "countryboya20@gmail.com";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedPost: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        reportedComment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        reportedListing: {
          select: {
            id: true,
            title: true,
            seller: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
