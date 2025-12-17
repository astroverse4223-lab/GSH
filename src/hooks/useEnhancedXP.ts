import { useState, useEffect, useCallback } from "react";
import { ENHANCED_XP_REWARDS } from "@/lib/enhanced-xp-system";
import { useToast } from "@/components/ui/Toast";

interface XPProgress {
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  loginStreak: number;
  totalLogins: number;
  daysSinceJoining: number;
  averageXPPerDay: number;
}

interface XPResult {
  xpGained: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
}

export function useEnhancedXP() {
  const [progress, setProgress] = useState<XPProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Fetch current XP progress
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/xp/enhanced?action=progress");

      if (!response.ok) {
        throw new Error("Failed to fetch XP progress");
      }

      const data = await response.json();
      setProgress(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Award XP for an activity
  const awardXP = useCallback(
    async (
      activity: keyof typeof ENHANCED_XP_REWARDS,
      metadata?: {
        sessionDuration?: number;
        participantCount?: number;
        engagementLevel?: "low" | "medium" | "high";
        isConsecutive?: boolean;
        multiplier?: number;
      }
    ): Promise<XPResult | null> => {
      try {
        const response = await fetch("/api/user/xp/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activity, metadata }),
        });

        if (!response.ok) {
          throw new Error("Failed to award XP");
        }

        const result = await response.json();

        // Debug: Log the actual response to see the structure
        console.log("XP API Response:", result);

        // Show toast notification for XP gain
        if (result) {
          // Handle the response structure correctly
          const xpGained = result.xpGained || result.totalXP || 0;
          const leveledUp = result.leveledUp || false;
          const newLevel = result.newLevel || 0;

          if (leveledUp) {
            showToast(
              `🎉 Level Up! You've reached Level ${newLevel} and gained ${xpGained} XP!`,
              "success",
              6000
            );
          } else {
            showToast(`⚡ +${xpGained} XP earned!`, "success", 3000);
          }
        }

        // Refresh progress after awarding XP
        await fetchProgress();

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [fetchProgress, showToast]
  );

  // Handle daily login
  const handleDailyLogin = useCallback(async (): Promise<XPResult[] | null> => {
    try {
      const response = await fetch("/api/user/xp/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: "DAILY_LOGIN" }),
      });

      if (!response.ok) {
        throw new Error("Failed to handle daily login");
      }

      const result = await response.json();

      // Show toast notifications for daily login rewards
      if (result.results && result.results.length > 0) {
        const totalXP = result.results.reduce(
          (sum: number, r: XPResult) => sum + r.xpGained,
          0
        );
        const hasLevelUp = result.results.some((r: XPResult) => r.leveledUp);

        if (hasLevelUp) {
          const levelUpResult = result.results.find(
            (r: XPResult) => r.leveledUp
          );
          showToast(
            `🎉 Daily Login Bonus! Level Up to ${levelUpResult?.newLevel}! Total: +${totalXP} XP`,
            "success",
            6000
          );
        } else {
          showToast(
            `📅 Daily Login Bonus: +${totalXP} XP earned!`,
            "success",
            4000
          );
        }
      }

      // Refresh progress after login
      await fetchProgress();

      return result.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [fetchProgress, showToast]);

  // Handle content engagement
  const handleContentEngagement = useCallback(
    async (
      contentType: "post" | "comment" | "story",
      engagementCount: number
    ): Promise<XPResult | null> => {
      try {
        const response = await fetch("/api/user/xp/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity: "CONTENT_ENGAGEMENT",
            contentType,
            engagementCount,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to handle content engagement");
        }

        const result = await response.json();

        if (result) {
          // Handle the response structure correctly
          const xpGained = result.xpGained || 0;
          const leveledUp = result.leveledUp || false;
          const newLevel = result.newLevel || 0;

          // Show toast notification for content engagement rewards
          if (leveledUp) {
            showToast(
              `🎉 Popular Content! Level Up to ${newLevel}! +${xpGained} XP`,
              "success",
              6000
            );
          } else if (xpGained > 0) {
            showToast(
              `🔥 Popular Content Bonus: +${xpGained} XP!`,
              "success",
              4000
            );
          }

          // Refresh progress after engagement
          await fetchProgress();
        }

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [fetchProgress, showToast]
  );

  // Auto-award XP based on user actions
  const autoAwardXP = useCallback(
    async (action: string, context?: any) => {
      const activityMap: Record<string, keyof typeof ENHANCED_XP_REWARDS> = {
        post_created: "POST_CREATION",
        comment_added: "COMMENT",
        friend_added: "ADD_FRIEND",
        post_boosted: "BOOST_POST",
        profile_updated: "UPDATE_PROFILE",
        story_created: "CREATE_STORY",
        game_played: "PLAY_GAME",
        game_won: "WIN_GAME",
        group_joined: "JOIN_GROUP",
        group_created: "CREATE_GROUP",
        item_listed: "LIST_ITEM",
        purchase_made: "MAKE_PURCHASE",
        stream_started: "START_STREAM",
        reaction_given: "REACTION_RECEIVED",
        profile_viewed: "PROFILE_VIEW",
        search_performed: "SEARCH_ACTIVITY",
      };

      const activity = activityMap[action];
      if (activity) {
        return await awardXP(activity, context);
      }

      return null;
    },
    [awardXP]
  );

  // Get formatted level display
  const getLevelDisplay = useCallback(() => {
    if (!progress) return { level: 1, title: "Rookie", emoji: "🌱" };

    const levelTitles: Record<number, { title: string; emoji: string }> = {
      1: { title: "Rookie", emoji: "🌱" },
      5: { title: "Novice", emoji: "🛡️" },
      10: { title: "Adventurer", emoji: "🗡️" },
      15: { title: "Rising Hero", emoji: "🚀" },
      25: { title: "Skilled Warrior", emoji: "⚔️" },
      35: { title: "Expert Player", emoji: "💎" },
      50: { title: "Master Gamer", emoji: "⭐" },
      75: { title: "Elite Champion", emoji: "🏆" },
      100: { title: "Legendary Master", emoji: "👑" },
    };

    let display = { title: "Rookie", emoji: "🌱" };
    for (const [level, info] of Object.entries(levelTitles)) {
      if (progress.level >= parseInt(level)) {
        display = info;
      }
    }

    return {
      level: progress.level,
      title: display.title,
      emoji: display.emoji,
      isSpecialLevel: [5, 10, 15, 25, 35, 50, 75, 100].includes(progress.level),
    };
  }, [progress]);

  // Calculate next level rewards
  const getNextLevelRewards = useCallback(() => {
    if (!progress) return [];

    const nextLevel = progress.level + 1;
    const rewards = [];

    if (nextLevel === 5) rewards.push("Custom Profile Theme");
    if (nextLevel === 10) rewards.push("Premium Features Trial");
    if (nextLevel === 25) rewards.push("Exclusive Badge");
    if (nextLevel === 50) rewards.push("VIP Status");
    if (nextLevel === 100) rewards.push("Legendary Title");

    return rewards;
  }, [progress]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    awardXP,
    handleDailyLogin,
    handleContentEngagement,
    autoAwardXP,
    fetchProgress,
    getLevelDisplay,
    getNextLevelRewards,
    rewards: ENHANCED_XP_REWARDS,
  };
}
