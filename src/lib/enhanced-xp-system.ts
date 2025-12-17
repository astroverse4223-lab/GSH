/**
 * Enhanced XP System - Extended functionality for more XP earning opportunities
 */

import { prisma } from "@/lib/prisma";
import { XP_REWARDS, calculateLevel, XPResult } from "./xp-system";

// New XP earning activities
export const ENHANCED_XP_REWARDS = {
  ...XP_REWARDS,

  // Daily Activities
  DAILY_LOGIN_STREAK_3: 15, // 3-day login streak bonus
  DAILY_LOGIN_STREAK_7: 30, // 7-day login streak bonus
  DAILY_LOGIN_STREAK_30: 100, // 30-day login streak bonus
  PROFILE_VIEW: 1, // When someone views your profile
  SEARCH_ACTIVITY: 2, // Active searching/browsing

  // Social Engagement
  FRIEND_ONLINE: 3, // When a friend comes online
  GROUP_MESSAGE: 8, // Sending messages in groups
  STORY_VIEW: 3, // Viewing others' stories
  STORY_REACTION: 5, // Reacting to stories
  PROFILE_COMPLETION: 50, // Completing profile sections

  // Content Creation
  POPULAR_POST: 25, // Post gets 10+ reactions
  VIRAL_POST: 100, // Post gets 50+ reactions
  CONTENT_SHARED: 15, // Your content gets shared
  COMMENT_THREAD: 10, // Starting active comment discussions

  // Gaming Activities
  GAME_SESSION_SHORT: 5, // 15+ minute game session
  GAME_SESSION_LONG: 15, // 60+ minute game session
  MULTIPLAYER_WIN: 30, // Winning multiplayer games
  TOURNAMENT_PARTICIPATION: 50, // Joining tournaments
  GAME_REVIEW: 20, // Writing game reviews

  // Community Building
  GROUP_INVITE: 12, // Inviting friends to groups
  EVENT_CREATION: 40, // Creating community events
  EVENT_PARTICIPATION: 20, // Participating in events
  HELPFUL_COMMENT: 8, // Comments that get positive reactions

  // Marketplace & Economy
  SUCCESSFUL_SALE: 25, // Completing marketplace sales
  MARKETPLACE_REVIEW: 15, // Writing product reviews
  TRADE_COMPLETION: 20, // Completing item trades

  // Streaming & Content
  STREAM_DURATION_BONUS: 5, // Per 30 minutes of streaming
  STREAM_VIEWERS_BONUS: 10, // Bonus per 5 concurrent viewers
  STREAM_INTERACTION: 8, // Engaging with stream chat

  // Weekly/Monthly Goals
  WEEKLY_GOAL_COMPLETE: 150, // Completing weekly objectives
  MONTHLY_CHALLENGE: 300, // Monthly challenge completion
  PERFECT_WEEK: 200, // All daily logins in a week

  // Special Achievements
  FIRST_WEEK: 200, // Completing first week on platform
  SOCIAL_BUTTERFLY: 100, // Adding 10+ friends in a day
  CONTENT_CREATOR: 150, // Creating 5+ posts in a day
  COMMUNITY_LEADER: 250, // Becoming a group moderator

  // Seasonal/Event XP
  HOLIDAY_BONUS: 50, // Special holiday activities
  BETA_TESTER: 500, // Participating in beta features
  FEEDBACK_PROVIDER: 75, // Providing valuable feedback
} as const;

// XP tracking for daily/weekly goals
export interface XPGoal {
  id: string;
  name: string;
  description: string;
  targetXP: number;
  currentXP: number;
  completed: boolean;
  resetType: "daily" | "weekly" | "monthly";
  reward: number;
}

// Activity tracking for bonus calculations
export interface ActivitySession {
  userId: string;
  activityType: string;
  startTime: Date;
  endTime?: Date;
  xpEarned: number;
  bonusApplied: boolean;
}

/**
 * Award XP with enhanced tracking and bonuses
 */
export async function awardEnhancedXP(
  userId: string,
  activity: keyof typeof ENHANCED_XP_REWARDS,
  metadata?: {
    sessionDuration?: number;
    participantCount?: number;
    engagementLevel?: "low" | "medium" | "high";
    isConsecutive?: boolean;
    multiplier?: number;
    customAmount?: number; // For admin awards
    adminReason?: string; // Reason for admin award
    awardedBy?: string; // Admin who awarded the XP
  }
): Promise<XPResult | null> {
  try {
    let baseXP: number;

    // Use custom amount if provided (for admin awards), otherwise use default
    if (metadata?.customAmount && metadata.customAmount > 0) {
      baseXP = metadata.customAmount;
    } else {
      baseXP = ENHANCED_XP_REWARDS[activity];
    }

    // Apply metadata-based bonuses (only if not a custom admin award)
    if (metadata && !metadata.customAmount) {
      if (metadata.sessionDuration && metadata.sessionDuration > 30) {
        // Bonus for longer sessions (5 XP per 30 minutes over 30 min)
        const bonusMinutes = Math.floor((metadata.sessionDuration - 30) / 30);
        baseXP += bonusMinutes * 5;
      }

      if (metadata.participantCount && metadata.participantCount > 1) {
        // Social activity bonus (10% per additional participant, max 50%)
        const socialBonus = Math.min(
          (metadata.participantCount - 1) * 0.1,
          0.5
        );
        baseXP = Math.floor(baseXP * (1 + socialBonus));
      }

      if (metadata.engagementLevel === "high") {
        baseXP = Math.floor(baseXP * 1.5);
      } else if (metadata.engagementLevel === "medium") {
        baseXP = Math.floor(baseXP * 1.25);
      }

      if (metadata.multiplier) {
        baseXP = Math.floor(baseXP * metadata.multiplier);
      }
    }

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        loginStreak: true,
        subscription: { select: { status: true } },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Apply streak and premium bonuses
    let finalXP = baseXP;

    // Login streak bonus (5% per streak day, max 25%)
    if (user.loginStreak > 1) {
      const streakBonus = Math.min(user.loginStreak * 0.05, 0.25);
      finalXP = Math.floor(finalXP * (1 + streakBonus));
    }

    // Premium subscription bonus (50% more XP)
    if (user.subscription?.status === "active") {
      finalXP = Math.floor(finalXP * 1.5);
    }

    // Weekend bonus (25% more XP on weekends)
    const today = new Date();
    if (today.getDay() === 0 || today.getDay() === 6) {
      finalXP = Math.floor(finalXP * 1.25);
    }

    const newXP = user.xp + finalXP;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > user.level;

    // Level up bonus XP
    if (leveledUp) {
      const levelUpBonus =
        (newLevel - user.level) * ENHANCED_XP_REWARDS.LEVEL_MILESTONE;
      finalXP += levelUpBonus;
    }

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // Log activity for analytics
    await logXPActivity(userId, activity, finalXP, metadata);

    return {
      xpGained: finalXP,
      newXP: newXP,
      newLevel: newLevel,
      leveledUp: leveledUp,
      previousLevel: user.level,
    };
  } catch (error) {
    console.error("Error awarding enhanced XP:", error);
    return null;
  }
}

/**
 * Log XP activity for analytics and tracking
 */
async function logXPActivity(
  userId: string,
  activity: string,
  xpGained: number,
  metadata?: any
) {
  try {
    // Create a simple activity log entry (you might want to create a proper model)
    console.log(
      `XP Activity: User ${userId} earned ${xpGained} XP for ${activity}`,
      metadata
    );

    // TODO: Implement proper activity logging table if needed
    // This could track daily/weekly XP earning patterns for analytics
  } catch (error) {
    console.error("Error logging XP activity:", error);
  }
}

/**
 * Check and award daily login streaks
 */
export async function handleDailyLogin(userId: string): Promise<XPResult[]> {
  const results: XPResult[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loginStreak: true,
        lastLoginDate: true,
        totalLogins: true,
      },
    });

    if (!user) return results;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    lastLogin?.setHours(0, 0, 0, 0);

    const isConsecutiveDay =
      lastLogin &&
      Math.abs(today.getTime() - lastLogin.getTime()) === 24 * 60 * 60 * 1000;

    let newStreak = isConsecutiveDay ? user.loginStreak + 1 : 1;

    // Award daily login XP
    const dailyResult = await awardEnhancedXP(userId, "DAILY_LOGIN");
    if (dailyResult) results.push(dailyResult);

    // Award streak bonuses
    if (newStreak === 3) {
      const streakResult = await awardEnhancedXP(
        userId,
        "DAILY_LOGIN_STREAK_3"
      );
      if (streakResult) results.push(streakResult);
    } else if (newStreak === 7) {
      const streakResult = await awardEnhancedXP(
        userId,
        "DAILY_LOGIN_STREAK_7"
      );
      if (streakResult) results.push(streakResult);
    } else if (newStreak === 30) {
      const streakResult = await awardEnhancedXP(
        userId,
        "DAILY_LOGIN_STREAK_30"
      );
      if (streakResult) results.push(streakResult);
    }

    // Update user login data
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginDate: new Date(),
        loginStreak: newStreak,
        totalLogins: user.totalLogins + 1,
      },
    });
  } catch (error) {
    console.error("Error handling daily login:", error);
  }

  return results;
}

/**
 * Auto-award XP for content engagement
 */
export async function handleContentEngagement(
  userId: string,
  contentType: "post" | "comment" | "story",
  engagementCount: number
): Promise<XPResult | null> {
  let activity: keyof typeof ENHANCED_XP_REWARDS;

  if (contentType === "post") {
    if (engagementCount >= 50) {
      activity = "VIRAL_POST";
    } else if (engagementCount >= 10) {
      activity = "POPULAR_POST";
    } else {
      return null; // No bonus for low engagement
    }
  } else if (contentType === "comment") {
    activity = "HELPFUL_COMMENT";
  } else {
    return null;
  }

  return await awardEnhancedXP(userId, activity, {
    engagementLevel:
      engagementCount >= 50 ? "high" : engagementCount >= 10 ? "medium" : "low",
  });
}

/**
 * Get user's XP progress and achievements
 */
export async function getUserXPProgress(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        loginStreak: true,
        totalLogins: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    const currentLevelXP = (user.level - 1) * 1000;
    const xpInCurrentLevel = user.xp - currentLevelXP;
    const xpForNextLevel = 1000;
    const progressPercent = (xpInCurrentLevel / xpForNextLevel) * 100;

    // Calculate days since joining
    const daysSinceJoining = user.createdAt
      ? Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      xp: user.xp,
      level: user.level,
      xpInCurrentLevel,
      xpForNextLevel,
      progressPercent: Math.round(progressPercent),
      loginStreak: user.loginStreak,
      totalLogins: user.totalLogins,
      daysSinceJoining,
      averageXPPerDay:
        daysSinceJoining > 0 ? Math.round(user.xp / daysSinceJoining) : 0,
    };
  } catch (error) {
    console.error("Error getting user XP progress:", error);
    return null;
  }
}

/**
 * Get available daily goals for user
 */
export function getDailyGoals(): XPGoal[] {
  return [
    {
      id: "daily_social",
      name: "Social Butterfly",
      description: "Make 3 posts and comment on 5 posts",
      targetXP: 45, // (3 * 10) + (5 * 5) = 45
      currentXP: 0,
      completed: false,
      resetType: "daily",
      reward: 50,
    },
    {
      id: "daily_gaming",
      name: "Gamer Focus",
      description: "Play games for 60 minutes total",
      targetXP: 60, // Varies based on game session length
      currentXP: 0,
      completed: false,
      resetType: "daily",
      reward: 75,
    },
    {
      id: "daily_community",
      name: "Community Helper",
      description: "React to 10 posts and share 2 pieces of content",
      targetXP: 50, // (10 * 2) + (2 * 15) = 50
      currentXP: 0,
      completed: false,
      resetType: "daily",
      reward: 100,
    },
  ];
}
