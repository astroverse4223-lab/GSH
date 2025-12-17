import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./ModernActiveUsers.module.css";

interface User {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  isPlaying?: boolean;
  currentGame?: string;
  lastSeen?: Date;
}

interface ModernActiveUsersProps {
  activeUsers: User[];
}

export default function ModernActiveUsers({
  activeUsers,
}: ModernActiveUsersProps) {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [displayUsers, setDisplayUsers] = useState<User[]>([]);

  useEffect(() => {
    // Add some mock gaming data to users
    const enhancedUsers = activeUsers.map((user) => ({
      ...user,
      isPlaying: Math.random() > 0.3,
      currentGame: Math.random() > 0.5 ? getRandomGame() : undefined,
      lastSeen: new Date(),
    }));
    setDisplayUsers(enhancedUsers);
  }, [activeUsers]);

  const getRandomGame = () => {
    const games = [
      "Counter-Strike 2",
      "Dota 2",
      "League of Legends",
      "Valorant",
      "Apex Legends",
      "Fortnite",
      "Rocket League",
      "Overwatch 2",
    ];
    return games[Math.floor(Math.random() * games.length)];
  };

  const getStatusText = (user: User) => {
    if (user.isPlaying && user.currentGame) {
      return `Playing ${user.currentGame}`;
    }
    return "Online";
  };

  const getStatusClass = (user: User) => {
    if (user.isPlaying) return styles.statusPlaying;
    return styles.statusOnline;
  };

  const getThemeClass = () => {
    if (!currentTheme?.id) {
      return "";
    }
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

  const handleFindPlayers = () => {
    router.push("/users");
  };

  const handleJoinGame = () => {
    router.push("/games/arcade");
  };

  return (
    <div className={`${styles.activeUsersCard} ${getThemeClass()}`}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <div className={styles.activityIndicator}>
            <div className={styles.activityDot}></div>
          </div>
          <span className={styles.headerText}>Active Gamers</span>
        </div>
        <div className={styles.userCount}>
          <span className={styles.countNumber}>{displayUsers.length}</span>
          <span className={styles.countLabel}>online</span>
        </div>
      </div>

      <div className={styles.usersList}>
        {displayUsers.length > 0 ? (
          displayUsers.map((user, index) => (
            <div
              key={user.id}
              className={`${styles.userItem} ${styles[`delay${index % 5}`]}`}>
              <Link href={`/users/${user.id}`} className={styles.userLink}>
                <div className={styles.userContent}>
                  {/* Avatar with Status */}
                  <div className={styles.avatarContainer}>
                    <div className={styles.avatarWrapper}>
                      <Image
                        src={getUserImageWithFallback(user)}
                        alt={user.name || "User"}
                        width={48}
                        height={48}
                        className={styles.avatar}
                        unoptimized
                      />
                    </div>
                    <div
                      className={`${styles.statusDot} ${getStatusClass(user)}`}>
                      {user.isPlaying && (
                        <div className={styles.playingIcon}>🎮</div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userStatus}>
                      {getStatusText(user)}
                    </div>
                  </div>

                  {/* Gaming Badge */}
                  {user.isPlaying && (
                    <div className={styles.gamingBadge}>
                      <span className={styles.gamingIcon}>🔥</span>
                    </div>
                  )}
                </div>

                {/* Hover Effects */}
                <div className={styles.hoverGlow}></div>
              </Link>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <p className={styles.emptyText}>No gamers online right now</p>
            <p className={styles.emptySubText}>Check back soon!</p>
          </div>
        )}
      </div>

      {/* Live Activity Indicator */}
      {displayUsers.length > 0 && (
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot}></div>
          <span className={styles.liveText}>Live activity</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button className={styles.actionButton} onClick={handleFindPlayers}>
          <span className={styles.actionIcon}>🔍</span>
          <span className={styles.actionText}>Find Players</span>
        </button>
        <button className={styles.actionButton} onClick={handleJoinGame}>
          <span className={styles.actionIcon}>🎯</span>
          <span className={styles.actionText}>Join Game</span>
        </button>
      </div>
    </div>
  );
}
