import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      bannerImage?: string | null;
      wallpaper?: string | null;
      bio?: string | null;
      musicUrl?: string | null;
      role?: string | null;
      subscription?: {
        id: string;
        status: string;
        tier: string;
        trialEnd?: Date | null;
        currentPeriodEnd?: Date | null;
      } | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    bannerImage?: string | null;
    wallpaper?: string | null;
    bio?: string | null;
    musicUrl?: string | null;
    role?: string | null;
    subscription?: {
      id: string;
      status: string;
      tier: string;
      trialEnd?: Date | null;
      currentPeriodEnd?: Date | null;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    bannerImage?: string | null;
    wallpaper?: string | null;
    musicUrl?: string | null;
    bio?: string | null;
  }
}
