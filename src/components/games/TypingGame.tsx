"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./GameComponents.module.css";

const TEXT_PROMPTS = [
  "Gaming is fun and brings people together worldwide.",
  "Practice makes perfect in all competitive games.",
  "Quick reflexes and strategy win most battles.",
  "The quick brown fox jumps over the lazy dog and runs through the mystical forest.",
  "Every gamer has their favorite genre and playstyle.",
  "Teamwork makes the dream work in multiplayer games.",
  "Good communication is key to gaming success.",
  "Virtual worlds offer endless adventure possibilities.",
  "Speed and accuracy are essential typing skills.",
  "Gaming communities connect players from everywhere.",
  "In a world filled with passionate gamers, every single click counts and every precise keystroke matters significantly.",
  "Gaming is not just about winning or losing, it's about the incredible journey and the amazing friends we make along the way.",
  "Practice makes perfect, but perfect practice makes excellence in gaming and creates lasting mastery over time.",
  "A truly skilled gamer knows that strategy and perfect timing are just as important as lightning-quick reflexes.",
  "The best games are those that challenge us to think differently and push our creative limits beyond imagination.",
  "Virtual worlds offer endless possibilities for adventure, discovery, and meaningful connections with other players worldwide.",
  "From simple puzzle games to complex RPGs, every genre has its own unique charm and dedicated community.",
  "Communication and teamwork are essential skills in modern multiplayer gaming environments that require coordination.",
  "Gaming communities bring people together from all corners of the world, creating bonds that transcend borders.",
  "The future of gaming is incredibly bright, with new technologies and innovations constantly emerging on the horizon.",
  "Every gamer has a unique story to tell, filled with challenges, triumphs, failures, and moments of pure joy.",
  "In the end, it's not just about the game itself, but the precious memories we create along the way.",
  "Gaming is a universal language that transcends borders, cultures, and brings people together through shared experiences.",
  "We will never know the answer to the ultimate question of life, the universe, and everything, but we can keep trying.",
];

interface TypingStats {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  charactersTyped: number;
  errorsCount: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

type GameState = "READY" | "PLAYING" | "FINISHED";
type Difficulty = "easy" | "medium" | "hard";

export function TypingGame() {
  const { data: session } = useSession();
  const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();
  const xpAwardedRef = useRef<boolean>(false); // Prevent duplicate XP awards
  const [gameState, setGameState] = useState<GameState>("READY");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentText, setCurrentText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number>(0);
  const [currentStats, setCurrentStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    timeElapsed: 0,
    charactersTyped: 0,
    errorsCount: 0,
  });
  const [highScore, setHighScore] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [streak, setStreak] = useState(0);
  const [perfectWords, setPerfectWords] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const difficultySettings = {
    easy: { minLength: 50, maxLength: 80, timeBonus: 50, label: "EASY" },
    medium: { minLength: 80, maxLength: 120, timeBonus: 100, label: "MEDIUM" },
    hard: { minLength: 120, maxLength: 200, timeBonus: 150, label: "HARD" },
  };

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(
            `/api/games/highscore?game=typing&userId=${session.user.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setHighScore(data.score || 0);
          }
        } catch (error) {
          console.error("Failed to load high score:", error);
        }
      }
    };
    loadHighScore();
  }, [session]);

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;

    const animateParticles = () => {
      setParticles((prevParticles) =>
        prevParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
            vy: particle.vy + 0.1, // gravity
          }))
          .filter((particle) => particle.life > 0)
      );
    };

    const interval = setInterval(animateParticles, 16); // 60fps
    return () => clearInterval(interval);
  }, [particles.length]);

  const createParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 5
  ) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 40,
        maxLife: 40,
        color,
        size: Math.random() * 3 + 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const getRandomPrompt = () => {
    const settings = difficultySettings[difficulty];
    const validPrompts = TEXT_PROMPTS.filter(
      (prompt) =>
        prompt.length >= settings.minLength &&
        prompt.length <= settings.maxLength
    );
    return validPrompts.length > 0
      ? validPrompts[Math.floor(Math.random() * validPrompts.length)]
      : TEXT_PROMPTS[0];
  };

  const calculateStats = useCallback(() => {
    if (!startTime) return;

    const timeElapsed = (Date.now() - startTime) / 1000; // seconds
    const timeInMinutes = timeElapsed / 60;
    const wordsTyped = userInput.trim().length / 5; // Standard: 5 chars = 1 word
    const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;

    let correct = 0;
    let errors = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === currentText[i]) {
        correct++;
      } else {
        errors++;
      }
    }

    const accuracy =
      userInput.length > 0
        ? Math.round((correct / userInput.length) * 100)
        : 100;

    setCurrentStats({
      wpm,
      accuracy,
      timeElapsed,
      charactersTyped: userInput.length,
      errorsCount: errors,
    });
  }, [userInput, currentText, startTime]);

  // Real-time stats calculation
  useEffect(() => {
    if (gameState === "PLAYING") {
      const interval = setInterval(calculateStats, 100);
      intervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [gameState, calculateStats]);

  const startGame = () => {
    const prompt = getRandomPrompt();
    setCurrentText(prompt);
    setUserInput("");
    setStartTime(Date.now());
    setGameState("PLAYING");
    xpAwardedRef.current = false; // Reset XP awarded flag
    setCurrentStats({
      wpm: 0,
      accuracy: 100,
      timeElapsed: 0,
      charactersTyped: 0,
      errorsCount: 0,
    });
    setStreak(0);
    setPerfectWords(0);
    setParticles([]);
  };

  const finishGame = useCallback(async () => {
    if (gameState !== "PLAYING") return; // Prevent multiple calls

    setGameState("FINISHED");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Calculate final stats directly for immediate use
    const timeElapsed = (Date.now() - startTime) / 1000; // seconds
    const timeInMinutes = timeElapsed / 60;
    const wordsTyped = userInput.trim().length / 5; // Standard: 5 chars = 1 word
    const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;

    let correct = 0;
    let errors = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === currentText[i]) {
        correct++;
      } else {
        errors++;
      }
    }

    const accuracy =
      userInput.length > 0
        ? Math.round((correct / userInput.length) * 100)
        : 100;

    const finalStats = {
      wpm,
      accuracy,
      timeElapsed,
      charactersTyped: userInput.length,
      errorsCount: errors,
    };

    // Update state with final stats
    setCurrentStats(finalStats);

    // Calculate final score
    const timeBonus = Math.max(
      0,
      difficultySettings[difficulty].timeBonus - finalStats.timeElapsed
    );
    const accuracyBonus = finalStats.accuracy >= 95 ? 100 : 0;
    const speedBonus = finalStats.wpm > 60 ? 50 : 0;
    const finalScore = finalStats.wpm + timeBonus + accuracyBonus + speedBonus;

    // Update high score and XP
    if (session?.user?.id && !xpAwardedRef.current) {
      try {
        xpAwardedRef.current = true; // Mark as awarded to prevent duplicates

        // Update high score if better
        if (finalScore > highScore) {
          await fetch("/api/games/highscore", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              game: "typing",
              score: finalScore,
            }),
          });
          setHighScore(finalScore);
        }

        // Calculate and award XP with toast notifications
        console.log("Typing game completed:", {
          wpm: finalStats.wpm,
          accuracy: finalStats.accuracy,
          score: finalScore,
        });

        // Always award game play XP
        await awardGamePlayXP();

        // Award win XP for good performance (80+ WPM or 95+ accuracy)
        if (finalStats.wpm >= 80 || finalStats.accuracy >= 95) {
          await awardGameWinXP();
        }
      } catch (error) {
        console.error("Failed to update score/XP:", error);
      }
    }
  }, [
    session,
    highScore,
    difficulty,
    startTime,
    userInput,
    currentText,
    difficultySettings,
  ]);

  useEffect(() => {
    if (gameState === "PLAYING" && userInput.length >= currentText.length) {
      finishGame();
    }
  }, [userInput.length, currentText.length, gameState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (gameState !== "PLAYING") return;

    // Check for correct character and create particles
    if (value.length > userInput.length) {
      const newCharIndex = value.length - 1;
      const isCorrect = value[newCharIndex] === currentText[newCharIndex];

      if (isCorrect) {
        setStreak((prev) => prev + 1);
        // Create particles for correct typing
        createParticles(500, 300, "#00ff00", 3);
      } else {
        setStreak(0);
        // Create particles for errors
        createParticles(500, 300, "#ff0000", 2);
      }
    }

    setUserInput(value);
  };

  const renderText = () => {
    return currentText.split("").map((char, index) => {
      let className = styles.typingChar;
      if (index < userInput.length) {
        className +=
          userInput[index] === char
            ? ` ${styles.correct}`
            : ` ${styles.incorrect}`;
      } else if (index === userInput.length) {
        className += ` ${styles.current}`;
      }
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const getSpeedRating = (speed: number) => {
    if (speed < 30)
      return { text: "Keep practicing!", emoji: "🌱", color: "#96CEB4" };
    if (speed < 50)
      return { text: "Good progress!", emoji: "🌟", color: "#FFEAA7" };
    if (speed < 70)
      return { text: "Fast typer!", emoji: "🚀", color: "#74B9FF" };
    if (speed < 90)
      return { text: "Lightning fast!", emoji: "⚡", color: "#E17055" };
    return { text: "Typing master!", emoji: "👑", color: "#FD79A8" };
  };

  const getProgressPercentage = () => {
    return Math.min(
      100,
      Math.round((userInput.length / currentText.length) * 100)
    );
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h1 className={styles.gameTitle}>
          <span className={styles.glowText}>Speed Typer</span>
        </h1>
        <div className={styles.gameStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>High Score</span>
            <span className={styles.statValue}>{highScore}</span>
          </div>
          {gameState === "PLAYING" && (
            <>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>WPM</span>
                <span className={styles.statValue}>{currentStats.wpm}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Accuracy</span>
                <span className={styles.statValue}>
                  {currentStats.accuracy}%
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Progress</span>
                <span className={styles.statValue}>
                  {getProgressPercentage()}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.typingContainer}>
        {gameState === "READY" ? (
          <div className={styles.gameMenu}>
            <div className={styles.difficultySelector}>
              <h3>Select Difficulty</h3>
              <div className={styles.difficultyButtons}>
                {Object.entries(difficultySettings).map(([key, settings]) => (
                  <button
                    key={key}
                    className={`${styles.difficultyBtn} ${
                      difficulty === key ? styles.active : ""
                    }`}
                    onClick={() => setDifficulty(key as Difficulty)}>
                    <div className={styles.difficultyTitle}>
                      {settings.label}
                    </div>
                    <div className={styles.difficultyInfo}>
                      {settings.minLength}-{settings.maxLength} chars
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mt-6">
              <h2>Ready to Test Your Typing Speed?</h2>
              <p className="mb-4">
                Type the text as fast and accurately as you can!
              </p>
              <p className="mb-6 text-sm opacity-75">
                Higher accuracy and speed = more XP!
              </p>
              <NeonButton onClick={startGame}>Start Game</NeonButton>
            </div>
          </div>
        ) : (
          <>
            {gameState === "PLAYING" && (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    data-progress={getProgressPercentage()}></div>
                </div>
                <div className={styles.streakDisplay}>
                  Streak: {streak} {streak > 10 && "🔥"}
                </div>
              </div>
            )}

            <div className={styles.typingTextContainer}>
              <div className={styles.typingText}>{renderText()}</div>
            </div>

            <textarea
              value={userInput}
              onChange={handleInputChange}
              className={styles.typingInput}
              placeholder="Start typing here..."
              autoFocus
              disabled={gameState === "FINISHED"}
              rows={4}
            />

            {gameState === "FINISHED" && (
              <div className={styles.typingResults}>
                <div className={styles.completionBurst}></div>
                <h2>🎉 Game Complete! 🎉</h2>

                <div className={styles.finalStats}>
                  <div className={styles.statGrid}>
                    <div className={styles.finalStat}>
                      <span className={styles.finalStatLabel}>WPM</span>
                      <span className={styles.finalStatValue}>
                        {currentStats.wpm}
                      </span>
                    </div>
                    <div className={styles.finalStat}>
                      <span className={styles.finalStatLabel}>Accuracy</span>
                      <span className={styles.finalStatValue}>
                        {currentStats.accuracy}%
                      </span>
                    </div>
                    <div className={styles.finalStat}>
                      <span className={styles.finalStatLabel}>Time</span>
                      <span className={styles.finalStatValue}>
                        {currentStats.timeElapsed.toFixed(1)}s
                      </span>
                    </div>
                    <div className={styles.finalStat}>
                      <span className={styles.finalStatLabel}>Errors</span>
                      <span className={styles.finalStatValue}>
                        {currentStats.errorsCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.ratingSection}>
                  <div className={styles.speedRating}>
                    {getSpeedRating(currentStats.wpm).emoji}{" "}
                    {getSpeedRating(currentStats.wpm).text}
                  </div>
                </div>

                {currentStats.wpm > highScore && (
                  <p className={styles.newRecord}>🏆 New High Score! 🏆</p>
                )}

                <div className={styles.gameCompleteButtons}>
                  <NeonButton onClick={startGame}>Try Again</NeonButton>
                  <NeonButton onClick={() => setGameState("READY")}>
                    Change Difficulty
                  </NeonButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Particle system */}
      {particles.length > 0 && (
        <div className={styles.particleContainer}>
          {particles.map((particle, index) => (
            <div
              key={index}
              className={styles.particle}
              data-x={particle.x}
              data-y={particle.y}
              data-color={particle.color}
              data-size={particle.size}
              data-opacity={particle.life / particle.maxLife}
            />
          ))}
        </div>
      )}
    </div>
  );
}
