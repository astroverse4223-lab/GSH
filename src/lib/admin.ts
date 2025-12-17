import { prisma } from "./prisma";

// Admin users (add your email here)
const ADMIN_EMAILS = [
  "countryboya20@gmail.com", // Your admin email
  // Add more admin emails here if needed
];

// Admin users get unlimited everything
export const ADMIN_LIMITS = {
  maxPostsPerDay: -1, // Unlimited
  maxStorageGB: -1, // Unlimited
  maxGroupMemberships: -1, // Unlimited
  maxGroupsCreated: -1, // Unlimited
  canCreateGroups: true,
  maxBoostsPerMonth: -1, // Unlimited
  canUseAdvancedFeatures: true,
  canUseCustomThemes: true,
  hasMarketplacePriority: true,
};

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) return false;

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get admin subscription (fake pro subscription for admins)
 */
export function getAdminSubscription() {
  return {
    tier: "pro", // Return pro instead of admin for theme compatibility
    status: "active",
    isActive: true,
    isPremium: true,
    isPro: true,
    isFree: false,
  };
}

/**
 * Create a free boost for admin users
 */
export async function createAdminBoost(
  userId: string,
  type: "POST_BOOST" | "PROFILE_BOOST" | "GROUP_BOOST",
  targetId?: string,
  durationHours: number = 24
) {
  if (!(await isUserAdmin(userId))) {
    throw new Error("Only admins can create free boosts");
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  return await prisma.boost.create({
    data: {
      userId,
      type,
      postId: type === "POST_BOOST" ? targetId : null,
      groupId: type === "GROUP_BOOST" ? targetId : null,
      duration: durationHours,
      amount: 0, // Free for admins
      status: "active",
      expiresAt,
    },
  });
}
