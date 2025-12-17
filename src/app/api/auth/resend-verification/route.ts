import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationExpires,
      },
    });

    // Send verification email
    try {
      const emailSent = await emailService.sendVerificationEmail(
        email,
        user.name || "User",
        verificationToken
      );

      if (!emailSent) {
        throw new Error("Email service returned false");
      }

      return NextResponse.json({
        message:
          "Verification email sent successfully. Please check your inbox.",
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return NextResponse.json(
        {
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in resend verification:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
