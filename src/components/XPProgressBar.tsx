import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useEnhancedXP } from "@/hooks/useEnhancedXP";
import styles from "./XPProgressBar.module.css";

interface XPProgressBarProps {
  currentXP?: number;
  xpToNextLevel?: number;
  level?: number;
  className?: string;
  showEnhancedInfo?: boolean;
  compact?: boolean;
}

export default function XPProgressBar({
  currentXP,
  xpToNextLevel,
  level,
  className = "",
  showEnhancedInfo = true,
  compact = false,
}: XPProgressBarProps) {
  const { currentTheme } = useTheme();
  const { progress, loading, getLevelDisplay, getNextLevelRewards } =
    useEnhancedXP();

  // Use enhanced XP data if available, fallback to props
  const displayData = progress
    ? {
        currentXP: progress.xpInCurrentLevel,
        xpToNextLevel: progress.xpForNextLevel,
        level: progress.level,
        totalXP: progress.xp,
        loginStreak: progress.loginStreak,
        progressPercent: progress.progressPercent,
      }
    : {
        currentXP: currentXP || 0,
        xpToNextLevel: xpToNextLevel || 1000,
        level: level || 1,
        totalXP: currentXP || 0,
        loginStreak: 0,
        progressPercent: Math.min(
          ((currentXP || 0) / (xpToNextLevel || 1000)) * 100,
          100
        ),
      };

  const levelDisplay = progress
    ? getLevelDisplay()
    : { level: displayData.level, title: "Rookie", emoji: "🌱" };
  const nextRewards = progress ? getNextLevelRewards() : [];

  const getThemeProgressBarClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.progressBarValorant;
      case "cyberpunk2077":
        return styles.progressBarCyberpunk;
      case "fortnite":
        return styles.progressBarFortnite;
      case "matrix":
        return styles.progressBarMatrix;
      case "synthwave":
        return styles.progressBarSynthwave;
      case "witcher":
        return styles.progressBarWitcher;
      case "ghostrunner":
        return styles.progressBarGhostrunner;
      case "darksouls":
        return styles.progressBarDarksouls;
      case "halo":
        return styles.progressBarHalo;
      case "default":
        return styles.progressBarDefault;
      default:
        return styles.progressBarDefault;
    }
  };

  const getThemeTextClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.textValorant;
      case "cyberpunk2077":
        return styles.textCyberpunk;
      case "fortnite":
        return styles.textFortnite;
      case "matrix":
        return styles.textMatrix;
      case "synthwave":
        return styles.textSynthwave;
      case "witcher":
        return styles.textWitcher;
      case "ghostrunner":
        return styles.textGhostrunner;
      case "darksouls":
        return styles.textDarksouls;
      case "halo":
        return styles.textHalo;
      case "default":
        return styles.textDefault;
      default:
        return styles.textDefault;
    }
  };

  return (
    <div
      className={`${styles.container} ${
        compact ? styles.compact : ""
      } ${className}`}>
      {loading && <div className={styles.skeleton}></div>}

      {!loading && (
        <>
          <div className={styles.levelInfo}>
            <div className={styles.levelBadge}>
              <span className={`${styles.levelText} ${getThemeTextClass()}`}>
                Level {displayData.level}
              </span>
              {showEnhancedInfo && !compact && (
                <span className={styles.levelTitle}>{levelDisplay.title}</span>
              )}
            </div>

            {showEnhancedInfo && displayData.loginStreak > 1 && (
              <div className={styles.streak}>
                🔥 {displayData.loginStreak} day streak
              </div>
            )}

            <span className={`${styles.xpText} ${getThemeTextClass()}`}>
              {displayData.currentXP}/{displayData.xpToNextLevel} XP
            </span>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBarBackground} />
            <div
              className={`${styles.progressBar} ${getThemeProgressBarClass()}`}
              style={
                {
                  width: `${displayData.progressPercent}%`,
                  "--progress-width": `${displayData.progressPercent}%`,
                } as React.CSSProperties & { "--progress-width": string }
              }
            />
          </div>

          {showEnhancedInfo && !compact && progress && (
            <div className={styles.enhancedInfo}>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total XP</span>
                  <span className={styles.statValue}>
                    {displayData.totalXP.toLocaleString()}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Days Active</span>
                  <span className={styles.statValue}>
                    {progress.daysSinceJoining}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg/Day</span>
                  <span className={styles.statValue}>
                    {progress.averageXPPerDay}
                  </span>
                </div>
              </div>

              {nextRewards.length > 0 && (
                <div className={styles.nextRewards}>
                  <div className={styles.rewardsTitle}>Next Level Rewards:</div>
                  <div className={styles.rewardsList}>
                    {nextRewards.map((reward, index) => (
                      <div key={index} className={styles.reward}>
                        🎁 {reward}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
