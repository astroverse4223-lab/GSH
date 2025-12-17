import React from "react";
import styles from "./LevelBadge.module.css";

interface LevelBadgeProps {
  level: number;
  className?: string;
  size?: "small" | "medium" | "large";
  showTitle?: boolean;
}

const getLevelTitle = (level: number): string => {
  if (level < 5) return "Rookie";
  if (level < 10) return "Scout";
  if (level < 20) return "Warrior";
  if (level < 35) return "Veteran";
  if (level < 50) return "Elite";
  if (level < 75) return "Master";
  if (level < 100) return "Grandmaster";
  return "Legend";
};

const getLevelColor = (level: number): string => {
  if (level < 5) return "bronze";
  if (level < 10) return "silver";
  if (level < 20) return "gold";
  if (level < 35) return "platinum";
  if (level < 50) return "diamond";
  if (level < 75) return "master";
  if (level < 100) return "grandmaster";
  return "legend";
};

export default function LevelBadge({
  level,
  className = "",
  size = "medium",
  showTitle = true,
}: LevelBadgeProps) {
  const levelTitle = getLevelTitle(level);
  const levelColor = getLevelColor(level);

  return (
    <div
      className={`${styles.badge} ${styles[size]} ${styles[levelColor]} ${className}`}>
      <div className={styles.level}>{level}</div>
      {showTitle && <div className={styles.title}>{levelTitle}</div>}
    </div>
  );
}
