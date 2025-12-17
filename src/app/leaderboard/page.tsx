"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Star, Gamepad2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./leaderboard.module.css";

interface XPLeader {
  id: string;
  name: string;
  username: string;
  image: string;
  xp: number;
  level: number;
}

interface GameScore {
  id: string;
  game: string;
  score: number;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  createdAt: string;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"xp" | "games">("xp");
  const [xpLeaders, setXpLeaders] = useState<XPLeader[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const games = [
    { id: "all", name: "All Games" },
    { id: "spaceshooter", name: "Space Shooter" },
    { id: "pacman", name: "Pac-Man" },
    { id: "snake", name: "Snake" },
    { id: "tetris", name: "Tetris" },
    { id: "memory", name: "Memory Game" },
    { id: "breakout", name: "Breakout" },
    { id: "pong", name: "Pong" },
  ];

  useEffect(() => {
    fetchXPLeaderboard();
    fetchGameScores();
  }, [selectedGame]);

  const fetchXPLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboards?type=xp");
      if (response.ok) {
        const data = await response.json();
        setXpLeaders(data);
      }
    } catch (error) {
      console.error("Error fetching XP leaderboard:", error);
    }
  };

  const fetchGameScores = async () => {
    try {
      const gameParam = selectedGame !== "all" ? `&game=${selectedGame}` : "";
      const response = await fetch(`/api/leaderboards?type=games${gameParam}`);
      if (response.ok) {
        const data = await response.json();
        setGameScores(data);
      }
    } catch (error) {
      console.error("Error fetching game scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className={styles.goldIcon} size={24} />;
      case 2:
        return <Medal className={styles.silverIcon} size={24} />;
      case 3:
        return <Trophy className={styles.bronzeIcon} size={24} />;
      default:
        return <span className={styles.rankNumber}>#{position}</span>;
    }
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  const formatScore = (score: number) => {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toLocaleString();
  };

  const isCurrentUser = (userId: string) => session?.user?.id === userId;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Trophy className={styles.loadingIcon} size={48} />
          <p>Loading leaderboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Trophy className={styles.headerIcon} size={32} />
          <div>
            <h1 className={styles.title}>Leaderboards</h1>
            <p className={styles.subtitle}>Compete with the best gamers</p>
          </div>
        </div>
      </div>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${
            activeTab === "xp" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("xp")}>
          <Star size={20} />
          XP Rankings
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "games" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("games")}>
          <Gamepad2 size={20} />
          Game Scores
        </button>
      </div>

      {activeTab === "xp" && (
        <div className={styles.content}>
          <div className={styles.leaderboardCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Users size={24} />
                Top Players by XP
              </h2>
            </div>

            {xpLeaders.length === 0 ? (
              <div className={styles.empty}>
                <Trophy size={48} />
                <p>No players found</p>
              </div>
            ) : (
              <div className={styles.leaderList}>
                {xpLeaders.map((leader, index) => (
                  <div
                    key={leader.id}
                    className={`${styles.leaderItem} ${
                      isCurrentUser(leader.id) ? styles.currentUser : ""
                    }`}>
                    <div className={styles.rank}>{getRankIcon(index + 1)}</div>
                    <Link
                      href={`/users/${leader.id}`}
                      className={styles.userInfo}>
                      <div className={styles.avatar}>
                        <Image
                          src={getUserImageWithFallback(leader)}
                          alt={leader.name}
                          width={48}
                          height={48}
                          className={styles.avatarImage}
                        />
                        {index < 3 && <div className={styles.avatarBadge} />}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{leader.name}</div>
                        <div className={styles.userLevel}>
                          Level {leader.level}
                        </div>
                      </div>
                    </Link>
                    <div className={styles.xpInfo}>
                      <div className={styles.xpValue}>
                        {formatXP(leader.xp)} XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "games" && (
        <div className={styles.content}>
          <div className={styles.leaderboardCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Gamepad2 size={24} />
                High Scores
              </h2>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className={styles.gameSelect}>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {gameScores.length === 0 ? (
              <div className={styles.empty}>
                <Gamepad2 size={48} />
                <p>
                  No scores found for{" "}
                  {games.find((g) => g.id === selectedGame)?.name}
                </p>
              </div>
            ) : (
              <div className={styles.leaderList}>
                {gameScores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`${styles.leaderItem} ${
                      isCurrentUser(score.user.id) ? styles.currentUser : ""
                    }`}>
                    <div className={styles.rank}>{getRankIcon(index + 1)}</div>
                    <Link
                      href={`/users/${score.user.id}`}
                      className={styles.userInfo}>
                      <div className={styles.avatar}>
                        <Image
                          src={getUserImageWithFallback(score.user)}
                          alt={score.user.name}
                          width={48}
                          height={48}
                          className={styles.avatarImage}
                        />
                        {index < 3 && <div className={styles.avatarBadge} />}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{score.user.name}</div>
                        <div className={styles.gameInfo}>
                          {games.find((g) => g.id === score.game)?.name ||
                            score.game}
                        </div>
                      </div>
                    </Link>
                    <div className={styles.scoreInfo}>
                      <div className={styles.scoreValue}>
                        {formatScore(score.score)}
                      </div>
                      <div className={styles.scoreDate}>
                        {new Date(score.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
