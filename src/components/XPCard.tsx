"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { Info, Trophy, Star, Award } from "lucide-react";
import styles from "./XPCard.module.css";

interface XPData {
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  xpForNextLevel: number;
}

interface XPCardProps {
  onOpenGuide?: () => void;
}

const getLevelBadge = (level: number) => {
  if (level >= 100)
    return { icon: "👑", title: "Legendary Master", color: "#FFD700" };
  if (level >= 75)
    return { icon: "🏆", title: "Elite Champion", color: "#E6E6FA" };
  if (level >= 50)
    return { icon: "⭐", title: "Master Gamer", color: "#FF6B6B" };
  if (level >= 35)
    return { icon: "💎", title: "Expert Player", color: "#4ECDC4" };
  if (level >= 25)
    return { icon: "⚔️", title: "Skilled Warrior", color: "#45B7D1" };
  if (level >= 15)
    return { icon: "🚀", title: "Rising Hero", color: "#FFA07A" };
  if (level >= 10) return { icon: "🗡️", title: "Adventurer", color: "#98D8C8" };
  if (level >= 5) return { icon: "🛡️", title: "Novice", color: "#F7DC6F" };
  return { icon: "🌱", title: "Rookie", color: "#AED6F1" };
};

export default function XPCard({ onOpenGuide }: XPCardProps) {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);

  const getThemeProgressFillClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.progressFillValorant;
      case "cyberpunk2077":
        return styles.progressFillCyberpunk;
      case "fortnite":
        return styles.progressFillFortnite;
      case "matrix":
        return styles.progressFillMatrix;
      case "synthwave":
        return styles.progressFillSynthwave;
      case "witcher":
        return styles.progressFillWitcher;
      case "ghostrunner":
        return styles.progressFillGhostrunner;
      case "darksouls":
        return styles.progressFillDarksouls;
      case "halo":
        return styles.progressFillHalo;
      case "default":
        return styles.progressFillDefault;
      default:
        return styles.progressFillDefault;
    }
  };

  useEffect(() => {
    fetchXPData();
  }, [session]);

  const fetchXPData = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/xp");
      if (response.ok) {
        const data = await response.json();
        setXpData(data);
      }
    } catch (error) {
      console.error("Error fetching XP data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSkeleton}></div>
          <div className={styles.loadingSkeleton}></div>
          <div className={styles.loadingSkeleton}></div>
        </div>
      </div>
    );
  }

  if (!xpData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <Star size={24} />
          <p>Unable to load XP data</p>
        </div>
      </div>
    );
  }

  const badge = getLevelBadge(xpData.level);
  const progressPercentage = (xpData.xpInCurrentLevel / 1000) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Trophy className={styles.trophyIcon} size={20} />
          <h3>Player Level</h3>
        </div>
        <button
          onClick={onOpenGuide}
          className={styles.guideButton}
          title="XP & Level Guide">
          <Info size={16} />
          <span>Guide</span>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.levelSection}>
          <div
            className={styles.levelBadge}
            style={{ backgroundColor: badge.color }}>
            <span className={styles.levelIcon}>{badge.icon}</span>
            <div className={styles.levelInfo}>
              <span className={styles.levelNumber}>Level {xpData.level}</span>
              <span className={styles.levelTitle}>{badge.title}</span>
            </div>
          </div>
        </div>

        <div className={styles.xpSection}>
          <div className={styles.xpHeader}>
            <span className={styles.xpLabel}>Experience Points</span>
            <span className={styles.xpValue}>
              {xpData.xp.toLocaleString()} XP
            </span>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={`${
                  styles.progressFill
                } ${getThemeProgressFillClass()}`}
                // eslint-disable-next-line react/forbid-dom-props
                style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className={styles.progressText}>
              <span>{xpData.xpInCurrentLevel} / 1,000 XP</span>
              <span className={styles.nextLevel}>
                {xpData.xpNeededForNext} XP to Level {xpData.level + 1}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.achievements}>
          <div className={styles.achievementItem}>
            <Award size={16} className={styles.achievementIcon} />
            <span>Level {xpData.level} Achieved</span>
          </div>
          {xpData.level >= 5 && (
            <div className={styles.achievementItem}>
              <Star size={16} className={styles.achievementIcon} />
              <span>Novice Badge Unlocked</span>
            </div>
          )}
          {xpData.level >= 10 && (
            <div className={styles.achievementItem}>
              <Trophy size={16} className={styles.achievementIcon} />
              <span>Adventurer Status</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
