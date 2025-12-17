import { NextResponse } from "next/server";
import { emailService } from "../../../../lib/email";

// Test endpoint to verify email configuration
export async function GET() {
  try {
    // Check if email credentials are configured
    const hasConfig = !!(
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_HOST
    );

    return NextResponse.json({
      configured: hasConfig,
      host: process.env.SMTP_HOST || "not configured",
      user: process.env.SMTP_USER ? "configured" : "not configured",
      password: process.env.SMTP_PASSWORD ? "configured" : "not configured",
      message: hasConfig
        ? "Email service is configured and ready"
        : "Email service needs configuration",
    });
  } catch (error) {
    console.error("Error checking email configuration:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      configured: false,
    });
  }
}

// Test endpoint to send a test email
export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return new NextResponse("Email address is required", { status: 400 });
    }

    const success = await emailService.sendEmail({
      to,
      subject: "Test Email from Gamer Social Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B1A;">🎮 Email Test Successful!</h2>
          <p>This is a test email from your Gamer Social Hub application.</p>
          <p>If you're reading this, your email configuration is working correctly!</p>
          <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (success) {
      return NextResponse.json({
        message: "Test email sent successfully",
        to,
        timestamp: new Date().toISOString(),
      });
    } else {
      return new NextResponse("Failed to send test email", { status: 500 });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  }
}
