import { PrismaClient } from "@prisma/client";
import { emailService } from "../src/lib/email";
import crypto from "crypto";

const prisma = new PrismaClient();

async function sendVerification() {
  const user = await prisma.user.findFirst({
    where: {
      email: "astroworld420@gmail.com",
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user || !user.email || !user.name) {
    console.log("User not found or missing required fields");
    return;
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString("hex");

  // Save token
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.name, token);
    console.log("✅ Verification email sent successfully");
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}

sendVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
