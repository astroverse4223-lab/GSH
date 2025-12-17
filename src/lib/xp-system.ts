/**
 * XP System - Handles experience points and leveling
 */

export interface XPResult {
  xpGained: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
}

export const XP_PER_LEVEL = 1000;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForNextLevel(currentLevel: number): number {
  return currentLevel * XP_PER_LEVEL;
}

/**
 * Calculate XP progress within current level
 */
export function calculateXPInCurrentLevel(
  totalXP: number,
  currentLevel: number
): number {
  const previousLevelXP = (currentLevel - 1) * XP_PER_LEVEL;
  return totalXP - previousLevelXP;
}

/**
 * Award XP to a user (client-side helper)
 */
export async function awardXP(amount: number): Promise<XPResult | null> {
  try {
    const response = await fetch("/api/user/xp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error("Failed to award XP");
    }

    const result = await response.json();

    return {
      xpGained: amount,
      newXP: result.xp,
      newLevel: result.level,
      leveledUp: result.leveledUp || false,
      previousLevel: result.level - (result.leveledUp ? 1 : 0),
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return null;
  }
}

/**
 * Get user's current XP data
 */
export async function getUserXP(): Promise<{
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
} | null> {
  try {
    const response = await fetch("/api/user/xp");

    if (!response.ok) {
      throw new Error("Failed to fetch XP");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching XP:", error);
    return null;
  }
}

/**
 * XP rewards for different activities
 */
export const XP_REWARDS = {
  // Getting Started
  FIRST_LOGIN: 25,
  EMAIL_VERIFICATION: 50,
  DAILY_LOGIN: 5,

  // Social Activities
  POST_CREATION: 10,
  COMMENT: 5,
  ADD_FRIEND: 15,
  BOOST_POST: 15,

  // Profile & Customization
  UPDATE_PROFILE: 5,
  CREATE_STORY: 7,

  // Gaming
  PLAY_GAME: 8,
  WIN_GAME: 20,
  GAME_COMPLETION: 50,
  HIGH_SCORE: 100,

  // Community
  JOIN_GROUP: 10,
  CREATE_GROUP: 25,

  // Marketplace
  LIST_ITEM: 12,
  MAKE_PURCHASE: 8,

  // Streaming
  START_STREAM: 15,

  // System
  REACTION_RECEIVED: 2,
  LEVEL_MILESTONE: 200,
} as const;

/**
 * Check if user should receive bonus XP (streaks, multipliers, etc.)
 */
export function calculateBonusXP(
  baseXP: number,
  bonusFactors?: {
    streak?: number;
    multiplier?: number;
    premium?: boolean;
  }
): number {
  let totalXP = baseXP;

  if (bonusFactors?.streak && bonusFactors.streak > 1) {
    // 10% bonus per streak day (max 50% bonus)
    const streakBonus = Math.min(bonusFactors.streak * 0.1, 0.5);
    totalXP += baseXP * streakBonus;
  }

  if (bonusFactors?.multiplier) {
    totalXP *= bonusFactors.multiplier;
  }

  if (bonusFactors?.premium) {
    // 25% bonus XP for premium users
    totalXP *= 1.25;
  }

  return Math.floor(totalXP);
}

/**
 * Get level progression milestones
 */
export function getLevelMilestones(level: number): {
  nextMilestone: number;
  progress: number;
  rewards: string[];
} {
  const milestones = [5, 10, 25, 50, 100];
  const nextMilestone = milestones.find((m) => m > level) || level + 50;
  const progress = level / nextMilestone;

  const rewards = [];
  if (nextMilestone === 5) rewards.push("Custom Profile Theme");
  if (nextMilestone === 10) rewards.push("Premium Features Trial");
  if (nextMilestone === 25) rewards.push("Exclusive Badge");
  if (nextMilestone === 50) rewards.push("VIP Status");
  if (nextMilestone === 100) rewards.push("Legendary Title");

  return { nextMilestone, progress, rewards };
}
