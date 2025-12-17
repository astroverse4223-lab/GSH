"use client";

import React from "react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import styles from "./XPNotificationDemo.module.css";

/**
 * Demo component showing how to integrate XP notifications throughout the app
 * This demonstrates the toast notification system for XP gains and level ups
 */
export function XPNotificationDemo() {
  const {
    awardPostCreationXP,
    awardCommentXP,
    awardReactionXP,
    awardFriendXP,
    awardBoostXP,
    awardGroupJoinXP,
    awardGroupCreationXP,
    awardProfileUpdateXP,
    awardGamePlayXP,
    awardGameWinXP,
    awardStoryCreationXP,
    awardStreamStartXP,
    awardMarketplaceXP,
    awardDailyLoginXP,
    awardContentEngagementXP,
  } = useXPNotifications();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🎮 XP Notification System Demo</h2>
      <p className={styles.description}>
        Click any button below to test XP awards with toast notifications!
      </p>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📝 Content Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            className={styles.button}
            onClick={() => awardPostCreationXP()}
            title="Award XP for creating a post">
            📝 Create Post (+5 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardCommentXP()}
            title="Award XP for adding a comment">
            💬 Add Comment (+2 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardReactionXP()}
            title="Award XP for giving a reaction">
            👍 Give Reaction (+1 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardStoryCreationXP()}
            title="Award XP for creating a story">
            📖 Create Story (+3 XP)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>👥 Social Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            className={styles.button}
            onClick={() => awardFriendXP()}
            title="Award XP for adding a friend">
            🤝 Add Friend (+10 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardGroupJoinXP()}
            title="Award XP for joining a group">
            👥 Join Group (+15 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardGroupCreationXP()}
            title="Award XP for creating a group">
            🏗️ Create Group (+25 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardBoostXP()}
            title="Award XP for boosting a post">
            🚀 Boost Post (+8 XP)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🎮 Gaming Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            className={styles.button}
            onClick={() => awardGamePlayXP()}
            title="Award XP for playing a game">
            🎮 Play Game (+5 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardGameWinXP()}
            title="Award XP for winning a game">
            🏆 Win Game (+20 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardStreamStartXP()}
            title="Award XP for starting a stream">
            📺 Start Stream (+15 XP)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🔧 Other Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            className={styles.button}
            onClick={() => awardProfileUpdateXP()}
            title="Award XP for updating profile">
            👤 Update Profile (+5 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardMarketplaceXP("list")}
            title="Award XP for listing an item">
            🏪 List Item (+10 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardMarketplaceXP("purchase")}
            title="Award XP for making a purchase">
            💰 Make Purchase (+5 XP)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>⭐ Special Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            className={styles.button}
            onClick={() => awardDailyLoginXP()}
            title="Award XP for daily login">
            📅 Daily Login (+10 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardContentEngagementXP("post", 15)}
            title="Award XP for popular content">
            🔥 Popular Post (+25 XP)
          </button>
          <button
            className={styles.button}
            onClick={() => awardContentEngagementXP("post", 55)}
            title="Award XP for viral content">
            💫 Viral Post (+50 XP)
          </button>
        </div>
      </div>

      <div className={styles.note}>
        <h4>🎯 How It Works:</h4>
        <ul>
          <li>
            🎉 <strong>Level Up notifications</strong> show for 6 seconds with
            celebration emoji
          </li>
          <li>
            ⚡ <strong>Regular XP notifications</strong> show for 3-4 seconds
          </li>
          <li>
            🔔 <strong>Toast notifications</strong> appear in the top-right
            corner
          </li>
          <li>
            📊 <strong>Progress tracking</strong> updates automatically
          </li>
        </ul>
      </div>

      <div className={styles.integration}>
        <h4>🔧 Integration Examples:</h4>
        <div className={styles.codeExample}>
          <h5>In PostCard.tsx:</h5>
          <pre>{`const { awardReactionXP, awardCommentXP } = useXPNotifications();

// Award XP for reactions
if (method === "POST") {
  await awardReactionXP();
}

// Award XP for comments
await awardCommentXP();`}</pre>
        </div>

        <div className={styles.codeExample}>
          <h5>In Game Components:</h5>
          <pre>{`const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();

// Award XP when game starts
await awardGamePlayXP();

// Award XP when player wins
if (playerWon) {
  await awardGameWinXP();
}`}</pre>
        </div>

        <div className={styles.codeExample}>
          <h5>In Group Components:</h5>
          <pre>{`const { awardGroupJoinXP, awardGroupCreationXP } = useXPNotifications();

// Award XP when joining a group
await awardGroupJoinXP();

// Award XP when creating a group
await awardGroupCreationXP();`}</pre>
        </div>
      </div>
    </div>
  );
}
