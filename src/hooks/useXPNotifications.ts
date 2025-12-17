"use client";

import { useCallback } from "react";
import { useEnhancedXP } from "./useEnhancedXP";

/**
 * Hook for triggering XP awards with automatic toast notifications
 * This hook provides convenience methods for common XP-awarding actions
 */
export function useXPNotifications() {
  const { autoAwardXP, awardXP, handleDailyLogin, handleContentEngagement } =
    useEnhancedXP();

  // Award XP for creating a post
  const awardPostCreationXP = useCallback(async () => {
    return await autoAwardXP("post_created");
  }, [autoAwardXP]);

  // Award XP for adding a comment
  const awardCommentXP = useCallback(async () => {
    return await autoAwardXP("comment_added");
  }, [autoAwardXP]);

  // Award XP for liking/reacting to content
  const awardReactionXP = useCallback(async () => {
    return await autoAwardXP("reaction_given");
  }, [autoAwardXP]);

  // Award XP for adding a friend
  const awardFriendXP = useCallback(async () => {
    return await autoAwardXP("friend_added");
  }, [autoAwardXP]);

  // Award XP for boosting a post
  const awardBoostXP = useCallback(async () => {
    return await autoAwardXP("post_boosted");
  }, [autoAwardXP]);

  // Award XP for joining a group
  const awardGroupJoinXP = useCallback(async () => {
    return await autoAwardXP("group_joined");
  }, [autoAwardXP]);

  // Award XP for creating a group
  const awardGroupCreationXP = useCallback(async () => {
    return await autoAwardXP("group_created");
  }, [autoAwardXP]);

  // Award XP for updating profile
  const awardProfileUpdateXP = useCallback(async () => {
    return await autoAwardXP("profile_updated");
  }, [autoAwardXP]);

  // Award XP for playing a game
  const awardGamePlayXP = useCallback(async () => {
    return await autoAwardXP("game_played");
  }, [autoAwardXP]);

  // Award XP for winning a game
  const awardGameWinXP = useCallback(async () => {
    return await autoAwardXP("game_won");
  }, [autoAwardXP]);

  // Award XP for starting a stream
  const awardStreamStartXP = useCallback(async () => {
    return await autoAwardXP("stream_started");
  }, [autoAwardXP]);

  // Award XP for creating a story
  const awardStoryCreationXP = useCallback(async () => {
    return await autoAwardXP("story_created");
  }, [autoAwardXP]);

  // Award XP for marketplace activity
  const awardMarketplaceXP = useCallback(
    async (action: "list" | "purchase") => {
      if (action === "list") {
        return await autoAwardXP("item_listed");
      } else {
        return await autoAwardXP("purchase_made");
      }
    },
    [autoAwardXP]
  );

  // Award daily login XP
  const awardDailyLoginXP = useCallback(async () => {
    return await handleDailyLogin();
  }, [handleDailyLogin]);

  // Award XP for content engagement (popular posts, etc.)
  const awardContentEngagementXP = useCallback(
    async (
      contentType: "post" | "comment" | "story",
      engagementCount: number
    ) => {
      return await handleContentEngagement(contentType, engagementCount);
    },
    [handleContentEngagement]
  );

  return {
    // Basic actions
    awardPostCreationXP,
    awardCommentXP,
    awardReactionXP,
    awardFriendXP,
    awardBoostXP,

    // Group actions
    awardGroupJoinXP,
    awardGroupCreationXP,

    // Profile actions
    awardProfileUpdateXP,

    // Game actions
    awardGamePlayXP,
    awardGameWinXP,

    // Content actions
    awardStoryCreationXP,
    awardStreamStartXP,

    // Marketplace actions
    awardMarketplaceXP,

    // Special actions
    awardDailyLoginXP,
    awardContentEngagementXP,

    // Direct access to underlying functions
    autoAwardXP,
    awardXP,
  };
}
