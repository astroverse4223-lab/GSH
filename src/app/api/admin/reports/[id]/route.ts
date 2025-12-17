import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

// Check if user is admin
async function isAdmin(session: any) {
  if (!session?.user?.email) return false;
  return session.user.email === "countryboya20@gmail.com";
}

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const [session, params] = await Promise.all([
      getServerSession(authOptions),
      context.params,
    ]);

    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const reportId = params.id; // Validate status
    const validStatuses = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Report ${reportId} status updated to ${status} by admin`);

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("Failed to update report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
