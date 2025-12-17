import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";
import {
  generateFallbackAvatar,
  generateFallbackBanner,
} from "@/lib/fallback-images";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { message: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          message:
            "Username can only contain letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { message: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { message: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: "Password must contain at least one number" },
        { status: 400 }
      );
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json(
        { message: "Password must contain at least one special character" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name: username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Get platform settings to check if email verification is required
    const platformSettings = await prisma.platformSettings.findFirst();
    const security = platformSettings?.security
      ? JSON.parse(platformSettings.security as string)
      : null;
    const requireEmailVerification = security?.requireEmailVerification ?? true;

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create verification token
    const verificationToken = `${Math.random()
      .toString(36)
      .substring(2)}${Date.now().toString(36)}`;
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create user with default profile image and banner using local fallbacks
    const defaultImage = generateFallbackAvatar(username);
    const defaultBanner = generateFallbackBanner(username);

    // Create user and verification token in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          name: username,
          email,
          password: hashedPassword,
          image: defaultImage,
          bannerImage: defaultBanner,
          emailVerified: requireEmailVerification ? null : new Date(),
        },
      });

      if (requireEmailVerification) {
        await prisma.verificationToken.create({
          data: {
            identifier: email,
            token: verificationToken,
            expires: tokenExpires,
          },
        });

        // Send verification email
        try {
          await emailService.sendVerificationEmail(
            email,
            username,
            verificationToken
          );
        } catch (emailError) {
          throw new Error("Failed to send verification email");
        }
      } else {
        // Send welcome email only if verification is not required
        try {
          await emailService.sendWelcomeEmail(email, username, user.id);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the signup if welcome email fails
        }
      }

      return user;
    });

    return NextResponse.json(
      {
        message: requireEmailVerification
          ? "Please check your email to verify your account"
          : "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}
