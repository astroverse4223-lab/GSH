import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Get fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            bannerImage: true,
            musicUrl: true,
            role: true,
            subscription: {
              select: {
                id: true,
                status: true,
                tier: true,
                trialEnd: true,
                currentPeriodEnd: true,
              },
            },
          },
        });

        if (dbUser) {
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          session.user.image = dbUser.image;
          session.user.bio = dbUser.bio;
          session.user.bannerImage = dbUser.bannerImage;
          session.user.musicUrl = dbUser.musicUrl;
          session.user.role = dbUser.role;
          session.user.subscription = dbUser.subscription;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              image: true,
              bannerImage: true,
              banned: true,
              banExpiresAt: true,
              bannedAt: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!user || !user.password) {
            console.log("Auth failed: User not found or no password", {
              email: credentials.email,
            });
            return null;
          }

          // Check if email verification is required
          const platformSettings = await prisma.platformSettings.findFirst();
          console.log("Platform settings:", {
            exists: !!platformSettings,
            security: platformSettings?.security,
            type: platformSettings?.security
              ? typeof platformSettings.security
              : "undefined",
          });

          let requireEmailVerification = true;

          // If platform settings exist, check security settings
          if (platformSettings?.security) {
            try {
              // Handle both string and object cases
              const security =
                typeof platformSettings.security === "string"
                  ? JSON.parse(platformSettings.security)
                  : platformSettings.security;

              requireEmailVerification =
                security.requireEmailVerification ?? true;
              console.log("Security settings parsed:", {
                requireEmailVerification,
              });
            } catch (error) {
              console.error("Error parsing security settings:", error);
              requireEmailVerification = true;
            }
          }

          if (requireEmailVerification && !user.emailVerified) {
            console.log("Auth failed: Email not verified", {
              email: credentials.email,
              requireEmailVerification,
              emailVerified: user.emailVerified,
            });
            return null;
          }

          // Verify password
          const isValid = await compare(credentials.password, user.password);
          console.log("Password verification:", {
            email: credentials.email,
            isValid,
          });

          if (!isValid) {
            console.log("Auth failed: Invalid password");
            throw new Error("Invalid email or password");
          }

          // Check if user is banned
          if (user.banned) {
            if (user.banExpiresAt) {
              const now = new Date();
              const banExpires = new Date(user.banExpiresAt);
              if (banExpires > now) {
                throw new Error(
                  "Your account is banned until " + banExpires.toLocaleString()
                );
              } else {
                // Ban expired, allow login and clear ban fields
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    banned: false,
                    banReason: null,
                    bannedAt: null,
                    banExpiresAt: null,
                  },
                });
              }
            } else {
              // Permanent ban
              throw new Error("Your account is permanently banned.");
            }
          }

          // Return the user without the password
          const { password, ...userWithoutPass } = user;
          return userWithoutPass;
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
};
