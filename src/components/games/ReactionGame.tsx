"use client";

import { useState, useEffect, useCallback } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./GameComponents.module.css";

type GameState = "WAITING" | "READY" | "CLICKING" | "FINISHED";

export function ReactionGame() {
  const [gameState, setGameState] = useState<GameState>("WAITING");
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number>(Infinity);
  const [countdown, setCountdown] = useState<number>(3);
  const [tooEarly, setTooEarly] = useState<boolean>(false);

  const getRandomDelay = () => {
    // Random delay between 1 and 5 seconds
    return Math.floor(Math.random() * 4000) + 1000;
  };

  const startGame = useCallback(() => {
    setGameState("READY");
    setTooEarly(false);
    setCountdown(3);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // After countdown, wait random time before showing target
          setTimeout(() => {
            setStartTime(Date.now());
            setGameState("CLICKING");
          }, getRandomDelay());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleClick = () => {
    if (gameState === "READY") {
      // Clicked too early
      setTooEarly(true);
      setGameState("WAITING");
      return;
    }

    if (gameState === "CLICKING") {
      const endTime = Date.now();
      const time = endTime - startTime;
      setReactionTime(time);
      setBestTime((prev) => Math.min(prev, time));
      setGameState("FINISHED");
    }
  };

  const getTimeColor = (time: number) => {
    if (time < 200) return "text-green-400";
    if (time < 300) return "text-blue-400";
    if (time < 400) return "text-yellow-400";
    return "text-red-400";
  };

  const getTimeRating = (time: number) => {
    if (time < 200) return "Lightning Fast! ⚡";
    if (time < 300) return "Very Quick! 🚀";
    if (time < 400) return "Good! 👍";
    return "Keep Practicing! 💪";
  };

  return (
    <div className={styles.gameContainer}>
      <h1 className={styles.gameTitle}>Reaction Time Test</h1>

      <div className={styles.gameStats}>
        {bestTime !== Infinity && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Best Time</span>
            <span className={`${styles.statValue} ${getTimeColor(bestTime)}`}>
              {bestTime}ms
            </span>
          </div>
        )}
      </div>

      <div
        className={`${styles.reactionArea} ${
          gameState === "CLICKING" ? styles.active : ""
        } ${tooEarly ? styles.tooEarly : ""}`}
        onClick={handleClick}>
        {gameState === "WAITING" && (
          <div className={styles.reactionMessage}>
            {tooEarly ? (
              <>
                <h2 className="text-red-400">Too Early!</h2>
                <p>Wait for the green color before clicking.</p>
                <NeonButton onClick={startGame}>Try Again</NeonButton>
              </>
            ) : (
              <>
                <h2>Test Your Reaction Time</h2>
                <p>Click when the screen turns green!</p>
                <NeonButton onClick={startGame}>Start Game</NeonButton>
              </>
            )}
          </div>
        )}

        {gameState === "READY" && (
          <div className={styles.reactionMessage}>
            <h2 className="text-4xl font-bold">{countdown}</h2>
            <p>Wait for green...</p>
          </div>
        )}

        {gameState === "CLICKING" && (
          <div className={styles.reactionMessage}>
            <h2 className="text-4xl">CLICK NOW!</h2>
          </div>
        )}

        {gameState === "FINISHED" && (
          <div className={styles.reactionResults}>
            <h2>Your Time: {reactionTime}ms</h2>
            <p className={`text-2xl ${getTimeColor(reactionTime)}`}>
              {getTimeRating(reactionTime)}
            </p>
            <NeonButton onClick={startGame}>Try Again</NeonButton>
          </div>
        )}
      </div>
    </div>
  );
}
