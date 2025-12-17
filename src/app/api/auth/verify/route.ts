import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find and validate the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });

      await prisma.verificationToken.delete({
        where: { token },
      });

      // Send welcome email after verification
      const user = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
        select: { id: true, name: true },
      });

      if (user) {
        try {
          await emailService.sendWelcomeEmail(
            verificationToken.identifier,
            user.name || "",
            user.id
          );
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }
    });

    // Redirect to success page with absolute URL
    return NextResponse.redirect("https://realmoflegends.info/auth/verified");
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Error verifying email" },
      { status: 500 }
    );
  }
}
