import React, { useState } from "react";
import LevelBadge from "./LevelBadge";
import styles from "./XPGuide.module.css";

interface XPGuideProps {
  className?: string;
}

const xpSources = [
  { activity: "Daily Login", xp: 10, icon: "📅" },
  { activity: "Create Post", xp: 5, icon: "📝" },
  { activity: "Comment on Post", xp: 2, icon: "💬" },
  { activity: "Like Post", xp: 1, icon: "👍" },
  { activity: "Join Group", xp: 15, icon: "👥" },
  { activity: "Complete Profile", xp: 50, icon: "👤" },
  { activity: "Space Shooter (per 100 points)", xp: 10, icon: "🚀" },
  { activity: "Frogger (per level)", xp: 25, icon: "🐸" },
  { activity: "Pac-Man (per 100 points)", xp: 10, icon: "👾" },
  { activity: "Win Game Match", xp: 100, icon: "🏆" },
];

const levelTiers = [
  {
    range: "1-4",
    title: "Rookie",
    color: "bronze",
    description: "Just getting started!",
  },
  {
    range: "5-9",
    title: "Scout",
    color: "silver",
    description: "Learning the ropes",
  },
  {
    range: "10-19",
    title: "Warrior",
    color: "gold",
    description: "Battle-tested",
  },
  {
    range: "20-34",
    title: "Veteran",
    color: "platinum",
    description: "Experienced fighter",
  },
  {
    range: "35-49",
    title: "Elite",
    color: "diamond",
    description: "Top tier player",
  },
  {
    range: "50-74",
    title: "Master",
    color: "master",
    description: "Legendary status",
  },
  {
    range: "75-99",
    title: "Grandmaster",
    color: "grandmaster",
    description: "Nearly unstoppable",
  },
  {
    range: "100+",
    title: "Legend",
    color: "legend",
    description: "Ultimate gaming deity",
  },
];

export default function XPGuide({ className = "" }: XPGuideProps) {
  const [activeTab, setActiveTab] = useState<"earn" | "levels">("earn");

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Experience Points Guide</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "earn" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("earn")}>
            How to Earn XP
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "levels" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("levels")}>
            Level Tiers
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === "earn" ? (
          <div className={styles.earnSection}>
            <p className={styles.description}>
              Gain experience points through various activities on the platform:
            </p>
            <div className={styles.activitiesList}>
              {xpSources.map((source, index) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityIcon}>{source.icon}</span>
                  <span className={styles.activityName}>{source.activity}</span>
                  <span className={styles.activityXP}>+{source.xp} XP</span>
                </div>
              ))}
            </div>
            <div className={styles.note}>
              <strong>Note:</strong> Each level requires 1,000 XP. Keep playing
              and engaging to climb the ranks!
            </div>
          </div>
        ) : (
          <div className={styles.levelsSection}>
            <p className={styles.description}>
              Progress through different tiers as you gain experience:
            </p>
            <div className={styles.tiersList}>
              {levelTiers.map((tier, index) => (
                <div key={index} className={styles.tierItem}>
                  <div className={styles.tierBadge}>
                    <LevelBadge
                      level={parseInt(tier.range.split("-")[0])}
                      size="small"
                      showTitle={false}
                    />
                  </div>
                  <div className={styles.tierInfo}>
                    <div className={styles.tierHeader}>
                      <span className={styles.tierTitle}>{tier.title}</span>
                      <span className={styles.tierRange}>
                        Levels {tier.range}
                      </span>
                    </div>
                    <p className={styles.tierDescription}>{tier.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
