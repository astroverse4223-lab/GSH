"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./GameComponents.module.css";

export function ClickerGame() {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setClicks(0);
    setTimeLeft(10);
    setIsPlaying(true);
    setFinalScore(null);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start a new timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPlaying(false);
          setFinalScore(clicks);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or when game stops
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, clicks]);

  const handleClick = () => {
    if (isPlaying) {
      setClicks((c) => c + 1);
    }
  };

  const getScoreMessage = (score: number) => {
    if (score < 40) return "Keep practicing!";
    if (score < 60) return "Not bad!";
    if (score < 80) return "Great job!";
    return "Amazing speed!";
  };

  return (
    <div className={styles.gameContainer}>
      <h1 className={styles.gameTitle}>Speed Clicker</h1>
      <p className={styles.gameDescription}>
        Click as many times as you can in 10 seconds!
      </p>

      <div className={styles.gameStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Time:</span>
          <span className={styles.statValue}>{timeLeft}s</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Clicks:</span>
          <span className={styles.statValue}>{clicks}</span>
        </div>
        {isPlaying && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>CPS:</span>
            <span className={styles.statValue}>
              {(clicks / (10 - timeLeft) || 0).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.gameArea}>
        {!isPlaying ? (
          <div className={styles.gameOver}>
            {finalScore !== null && (
              <div className={styles.finalScore}>
                <h2>Game Over!</h2>
                <p>Your Score: {finalScore} clicks</p>
                <p>({(finalScore / 10).toFixed(1)} clicks per second)</p>
                <p className={styles.scoreMessage}>
                  {getScoreMessage(finalScore)}
                </p>
              </div>
            )}
            <NeonButton onClick={startGame}>
              {finalScore === null ? "Start Game" : "Play Again"}
            </NeonButton>
          </div>
        ) : (
          <button
            className={styles.clickerButton}
            onClick={handleClick}
            aria-label="Click me!">
            Click!
          </button>
        )}
      </div>
    </div>
  );
}
