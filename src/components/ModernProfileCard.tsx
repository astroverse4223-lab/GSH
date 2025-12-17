import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import Link from "next/link";
import { FollowerStats } from "@/components/FollowerStats";
import XPProgressBar from "@/components/XPProgressBar";
import { useEnhancedXP } from "@/hooks/useEnhancedXP";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./ModernProfileCard.module.css";
import { useEffect, useRef } from "react";

interface ModernProfileCardProps {
  friends: any[];
}

export default function ModernProfileCard({ friends }: ModernProfileCardProps) {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const { progress, loading, getLevelDisplay } = useEnhancedXP();
  const xpBarRef = useRef<HTMLDivElement>(null);

  const levelDisplay = getLevelDisplay();
  const currentLevel = progress?.level || 1;

  const getThemeClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.valorant;
      case "cyberpunk2077":
        return styles.cyberpunk;
      case "fortnite":
        return styles.fortnite;
      case "matrix":
        return styles.matrix;
      case "synthwave":
        return styles.synthwave;
      case "witcher":
        return styles.witcher;
      case "ghostrunner":
        return styles.ghostrunner;
      case "darksouls":
        return styles.darksouls;
      case "halo":
        return styles.halo;
      case "default":
        return styles.default;
      default:
        return "";
    }
  };

  const getXpBarClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.xpFillValorant;
      case "cyberpunk2077":
        return styles.xpFillCyberpunk;
      case "fortnite":
        return styles.xpFillFortnite;
      case "matrix":
        return styles.xpFillMatrix;
      case "synthwave":
        return styles.xpFillSynthwave;
      case "witcher":
        return styles.xpFillWitcher;
      case "ghostrunner":
        return styles.xpFillGhostrunner;
      case "darksouls":
        return styles.xpFillDarksouls;
      case "halo":
        return styles.xpFillHalo;
      case "default":
        return styles.xpFillDefault;
      default:
        return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Update XP bar width - no longer needed as enhanced XP system handles this
  // useEffect(() => {
  //   if (xpBarRef.current && !loading) {
  //     const percentage =
  //       (progress?.xpInCurrentLevel / progress?.xpForNextLevel) * 100;
  //     xpBarRef.current.style.width = `${percentage}%`;
  //   }
  // }, [progress, loading]);

  if (!session?.user) {
    return (
      <div className={`${styles.profileCard} ${getThemeClass()}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <p className={styles.emptyText}>Sign in to see your profile</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${styles.profileCard} ${getThemeClass()}`}>
      <div className={styles.profileHeader}>
        <div className={styles.profileBadge}>
          <span className={styles.badgeIcon}>👑</span>
          <span className={styles.badgeText}>Your Profile</span>
        </div>
      </div>

      <Link href="/profile" className={styles.profileLink}>
        <div className={styles.profileContent}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <Image
                src={getUserImageWithFallback(session.user)}
                alt={session.user.name || "Profile"}
                width={80}
                height={80}
                className={styles.avatar}
                unoptimized
              />
              <div className={styles.statusIndicator}>
                <div className={styles.statusDot}></div>
              </div>
            </div>

            <div className={styles.levelBadge}>
              <span className={styles.levelIcon}>{levelDisplay.emoji}</span>
              <span className={styles.levelTitle}>{levelDisplay.title}</span>
            </div>
          </div>

          {/* User Info */}
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{session.user.name}</h3>
            <p className={styles.userBio}>
              {session.user.bio || "Gaming enthusiast 🎮"}
            </p>
          </div>

          {/* XP Progress */}
          <div className={styles.xpSection}>
            {loading ? (
              <div className={styles.loadingXP}>Loading XP...</div>
            ) : (
              <>
                <XPProgressBar
                  showEnhancedInfo={true}
                  compact={false}
                  className={styles.xpProgressBar}
                />
                {progress && progress.loginStreak > 1 && (
                  <div className={styles.streakInfo}>
                    🔥 {progress.loginStreak} day streak
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statValue}>{friends.length}</div>
              <div className={styles.statLabel}>Friends</div>
            </div>

            {session?.user?.id && (
              <div className={styles.statWrapper}>
                <FollowerStats userId={session.user.id} />
              </div>
            )}

            <div className={styles.statItem}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>
                {loading ? "..." : currentLevel}
              </div>
              <div className={styles.statLabel}>Level</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>⚙️</span>
              <span className={styles.actionText}>Settings</span>
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>📊</span>
              <span className={styles.actionText}>Stats</span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
