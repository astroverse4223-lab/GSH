import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = new PrismaClient();
const resend = new Resend(process.env.SMTP_PASSWORD);

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

  const verificationUrl = `https://realmoflegends.info/api/auth/verify?token=${token}`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #4F46E5;">Welcome to Gamer Social Hub!</h1>
      <p>Hi ${user.name},</p>
      <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: "Gamer Social Hub <noreply@realmoflegends.info>",
      to: [user.email],
      subject: "🎮 Verify your email address - Gamer Social Hub",
      html: html,
    });
    console.log("✅ Verification email sent successfully:", data);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}

sendVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
