import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.log("Password reset requested for non-existent email:", email);
      // Don't reveal if email exists for security
      return NextResponse.json(
        {
          message: "If that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    console.log("Processing password reset for user:", {
      email: user.email,
      name: user.name,
      id: user.id,
    });

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Create new password reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email,
        expiresAt,
      },
    });

    // Send password reset email
    try {
      console.log("Attempting to send password reset email:", {
        to: email,
        name: user.name || "User",
        tokenLength: resetToken.length,
      });

      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        user.name || "User",
        resetToken
      );

      console.log("Password reset email result:", {
        success: emailSent,
        to: email,
      });

      if (!emailSent) {
        throw new Error("Email service returned false");
      }
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        { message: "Failed to send password reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "If that email exists, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
