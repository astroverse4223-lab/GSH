import { NextResponse } from "next/server";

// This is a development endpoint to manually trigger export processing
// In production, you'd use a cron job or background service like Vercel Cron, AWS Lambda, etc.
export async function POST() {
  try {
    // Call the background processor
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/privacy/export/process`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    return NextResponse.json({
      message: "Background processing triggered",
      result,
    });
  } catch (error) {
    console.error("Error triggering background processing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Export trigger endpoint is active",
    usage: "POST to this endpoint to trigger background export processing",
    note: "This is for development only. In production, use cron jobs or background services.",
  });
}
