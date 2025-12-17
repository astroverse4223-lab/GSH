"use client";

import { useState } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { games } from "@/lib/games/constants";
import { ClickerGame } from "@/components/games/ClickerGame";
import { SnakeGame } from "@/components/games/SnakeGame";
import { TypingGame } from "@/components/games/TypingGame";
import { ReactionGame } from "@/components/games/ReactionGame";
import SpaceShooterGame from "@/components/games/SpaceShooterGame";
import FroggerGame from "@/components/games/FroggerGame";
import PacManGame from "@/components/games/PacManGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import styles from "./games.module.css";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  const renderGame = (gameId: string) => {
    switch (gameId) {
      case "clicker":
        return <ClickerGame />;
      case "snake":
        return <SnakeGame />;
      case "typing":
        return <TypingGame />;
      case "reaction":
        return <ReactionGame />;
      case "space-shooter":
        return <SpaceShooterGame />;
      case "frogger":
        return <FroggerGame />;
      case "pacman":
        return <PacManGame />;
      case "memory":
        return <MemoryGame />;
      default:
        return (
          <div className={styles.comingSoon}>
            <h2>Coming Soon!</h2>
            <p>This game is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={styles.pageTitle}>Arcade Zone</h1>

      {selectedGame ? (
        <div>
          <button
            onClick={() => setSelectedGame(null)}
            className={styles.backButton}>
            ← Back to Games
          </button>
          <div className={styles.gameWrapper}>{renderGame(selectedGame)}</div>
        </div>
      ) : (
        <div className={styles.gamesGrid}>
          {games.map((game) => (
            <GlowCard
              key={game.id}
              className={styles.gameCard}
              onClick={() => setSelectedGame(game.id)}
              glowColor="primary">
              <div className={styles.gameThumb}>
                <span className={styles.gameEmoji}>{game.thumbnail}</span>
              </div>
              <div className={styles.gameInfo}>
                <h2 className={styles.gameName}>{game.name}</h2>
                <p className={styles.gameDesc}>{game.description}</p>
                {game.highScore && (
                  <p className={styles.highScore}>
                    High Score: {game.highScore}
                  </p>
                )}
                {game.personalBest && (
                  <p className={styles.personalBest}>
                    Your Best: {game.personalBest}
                  </p>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
