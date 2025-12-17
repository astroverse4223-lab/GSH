import { prisma } from "./prisma";
import { isUserAdmin, getAdminSubscription, ADMIN_LIMITS } from "./admin";

export interface UserSubscription {
  tier: string;
  status: string;
  isActive: boolean;
  isPremium: boolean;
  isPro: boolean;
  isFree: boolean;
}

export interface SubscriptionLimits {
  maxPostsPerDay: number;
  maxStorageGB: number;
  maxGroupMemberships: number;
  maxGroupsCreated: number;
  canCreateGroups: boolean;
  maxBoostsPerMonth: number;
  canUseAdvancedFeatures: boolean;
  canUseCustomThemes: boolean;
  hasMarketplacePriority: boolean;
}

// Subscription tier limits configuration
export const TIER_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    maxPostsPerDay: 10,
    maxStorageGB: 1,
    maxGroupMemberships: 5, // Can join 5 groups
    maxGroupsCreated: 2, // Can create 2 groups
    canCreateGroups: true, // Allow creating groups but with limit
    maxBoostsPerMonth: 5, // 5 free boosts per month
    canUseAdvancedFeatures: false,
    canUseCustomThemes: false,
    hasMarketplacePriority: false,
  },
  premium: {
    maxPostsPerDay: 50,
    maxStorageGB: 10, // 10GB for premium
    maxGroupMemberships: 10, // Can join 10 groups
    maxGroupsCreated: 10, // Can create 10 groups
    canCreateGroups: true,
    maxBoostsPerMonth: 25, // 25 free boosts per month
    canUseAdvancedFeatures: true,
    canUseCustomThemes: true,
    hasMarketplacePriority: false,
  },
  pro: {
    maxPostsPerDay: -1, // Unlimited
    maxStorageGB: -1, // Unlimited storage for pro
    maxGroupMemberships: -1, // Unlimited
    maxGroupsCreated: -1, // Unlimited
    canCreateGroups: true,
    maxBoostsPerMonth: -1, // Unlimited
    canUseAdvancedFeatures: true,
    canUseCustomThemes: true,
    hasMarketplacePriority: true,
  },
};

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  // Check if user is admin first
  if (await isUserAdmin(userId)) {
    return getAdminSubscription();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const subscription = user?.subscription;
  const tier = subscription?.tier || "free";
  const status = subscription?.status || "inactive";
  const isActive = status === "active";

  return {
    tier,
    status,
    isActive: isActive && tier !== "free",
    isPremium: isActive && tier === "premium",
    isPro: isActive && tier === "pro",
    isFree: !isActive || tier === "free",
  };
}

export function getSubscriptionLimits(tier: string): SubscriptionLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export async function getUserLimits(
  userId: string
): Promise<SubscriptionLimits> {
  // Check if user is admin first
  if (await isUserAdmin(userId)) {
    return ADMIN_LIMITS;
  }

  const subscription = await getUserSubscription(userId);
  return getSubscriptionLimits(subscription.tier);
}

// Usage tracking functions
export async function getUserPostCountToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.post.count({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count;
}

export async function getUserStorageUsageGB(userId: string): Promise<number> {
  // This would require tracking file sizes in your database
  // For now, return 0 - you'll need to implement file size tracking
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true }, // Add this field to your User model
  });

  return Number(user?.storageUsed || 0) / (1024 * 1024 * 1024); // Convert bytes to GB
}

export async function getUserGroupCount(userId: string): Promise<number> {
  const count = await prisma.groupMember.count({
    where: { userId },
  });

  return count;
}

export async function getUserBoostCountThisMonth(
  userId: string
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const count = await prisma.boost.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  return count;
}

// Validation functions
export async function canUserCreatePost(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserLimits(userId);

  if (limits.maxPostsPerDay === -1) {
    return { allowed: true };
  }

  const todayCount = await getUserPostCountToday(userId);

  if (todayCount >= limits.maxPostsPerDay) {
    return {
      allowed: false,
      reason: `Daily post limit reached (${limits.maxPostsPerDay} posts). Upgrade to premium for more posts!`,
    };
  }

  return { allowed: true };
}

export async function canUserBoostPost(
  userId: string
): Promise<{ allowed: boolean; reason?: string; remainingBoosts?: number }> {
  const limits = await getUserLimits(userId);

  // Pro users have unlimited boosts
  if (limits.maxBoostsPerMonth === -1) {
    return { allowed: true };
  }

  const monthlyCount = await getUserBoostCountThisMonth(userId);
  const remaining = limits.maxBoostsPerMonth - monthlyCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason:
        "Monthly boost limit reached. Upgrade your subscription for more boosts!",
    };
  }

  return { allowed: true, remainingBoosts: remaining };
}

export async function canUserUploadFile(
  userId: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserLimits(userId);
  const currentUsageGB = await getUserStorageUsageGB(userId);
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);

  // Check if user has unlimited storage
  if (limits.maxStorageGB === -1) {
    return { allowed: true };
  }

  if (currentUsageGB + fileSizeGB > limits.maxStorageGB) {
    return {
      allowed: false,
      reason: `Storage limit exceeded. Current: ${currentUsageGB.toFixed(
        2
      )}GB, Limit: ${limits.maxStorageGB}GB. Upgrade for more storage!`,
    };
  }

  return { allowed: true };
}

async function getUserCreatedGroupsCount(userId: string): Promise<number> {
  const count = await prisma.group.count({
    where: { ownerId: userId },
  });
  return count;
}

export async function canUserCreateGroup(
  userId: string
): Promise<{ allowed: boolean; reason?: string; remainingGroups?: number }> {
  const limits = await getUserLimits(userId);

  if (!limits.canCreateGroups) {
    return {
      allowed: false,
      reason: "Group creation requires a subscription upgrade.",
    };
  }

  // Pro users have unlimited group creation
  if (limits.maxGroupsCreated === -1) {
    return { allowed: true };
  }

  const currentCount = await getUserCreatedGroupsCount(userId);
  const remaining = limits.maxGroupsCreated - currentCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Group creation limit reached. You can create up to ${limits.maxGroupsCreated} groups. Upgrade for more!`,
    };
  }

  return { allowed: true, remainingGroups: remaining };
}

export async function canUserJoinGroup(
  userId: string
): Promise<{ allowed: boolean; reason?: string; remainingJoins?: number }> {
  const limits = await getUserLimits(userId);

  // Pro users have unlimited group memberships
  if (limits.maxGroupMemberships === -1) {
    return { allowed: true };
  }

  const currentMemberships = await prisma.groupMember.count({
    where: { userId },
  });

  const remaining = limits.maxGroupMemberships - currentMemberships;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Group membership limit reached. You can join up to ${limits.maxGroupMemberships} groups. Upgrade for more!`,
    };
  }

  return { allowed: true, remainingJoins: remaining };
}
