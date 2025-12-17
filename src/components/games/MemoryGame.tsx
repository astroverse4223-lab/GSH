"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./GameComponents.module.css";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
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

const CARD_EMOJIS = [
  "🎮",
  "🎲",
  "🎯",
  "🎪",
  "🎨",
  "🎭",
  "🎬",
  "🎸",
  "🚀",
  "⭐",
  "💎",
  "🔥",
];
const CARD_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
];

export function MemoryGame() {
  const { data: session } = useSession();
  const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();
  const xpAwardedRef = useRef<boolean>(false); // Prevent duplicate XP awards
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const [streak, setStreak] = useState(0);
  const [perfectBonus, setPerfectBonus] = useState(false);

  const difficultySettings = {
    easy: { pairs: 6, gridCols: 4, timeBonus: 50 },
    medium: { pairs: 8, gridCols: 4, timeBonus: 100 },
    hard: { pairs: 12, gridCols: 6, timeBonus: 150 },
  };

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(
            `/api/games/highscore?game=memory&userId=${session.user.id}`
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && gameStartTime && !gameComplete) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameStartTime, gameComplete]);

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
    count: number = 8
  ) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 60,
        maxLife: 60,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const calculateScore = (
    moves: number,
    timeElapsed: number,
    streakBonus: number
  ) => {
    const settings = difficultySettings[difficulty];
    const baseScore = settings.pairs * 100;
    const movesPenalty = Math.max(0, moves - settings.pairs) * 5;
    const timeBonus = Math.max(0, settings.timeBonus - timeElapsed);
    const difficultyMultiplier =
      difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
    const perfectBonusPoints = perfectBonus ? 500 : 0;

    return Math.floor(
      (baseScore -
        movesPenalty +
        timeBonus +
        streakBonus +
        perfectBonusPoints) *
        difficultyMultiplier
    );
  };

  const shuffleCards = useCallback(() => {
    const settings = difficultySettings[difficulty];
    const gameEmojis = CARD_EMOJIS.slice(0, settings.pairs);

    // Create pairs with unique IDs and colors
    const cardPairs = gameEmojis.flatMap((emoji, index) => [
      {
        id: index * 2,
        emoji,
        isFlipped: false,
        isMatched: false,
        color: CARD_COLORS[index % CARD_COLORS.length],
      },
      {
        id: index * 2 + 1,
        emoji,
        isFlipped: false,
        isMatched: false,
        color: CARD_COLORS[index % CARD_COLORS.length],
      },
    ]);

    // Fisher-Yates shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setGameStartTime(Date.now());
    setIsPlaying(true);
    setGameStarted(true);
    setGameComplete(false);
    setScore(0);
    setStreak(0);
    setPerfectBonus(true);
    setParticles([]);
    xpAwardedRef.current = false; // Reset XP awarded flag
  }, [difficulty]);

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || gameComplete) return;
    if (flippedCards.length === 2) return;
    if (cards.find((c) => c.id === cardId)?.isMatched) return;
    if (flippedCards.includes(cardId)) return;

    const clickedCard = cards.find((c: Card) => c.id === cardId);
    if (!clickedCard) return;

    // Create click particles
    const cardElement = document.querySelector(
      `[data-card-id="${cardId}"]`
    ) as HTMLElement;
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      createParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        clickedCard.color,
        4
      );
    }

    // Flip the card
    setCards((prevCards: Card[]) =>
      prevCards.map((card: Card) => ({
        ...card,
        isFlipped:
          card.id === cardId ||
          card.isMatched ||
          flippedCards.includes(card.id),
      }))
    );

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves((prev: number) => prev + 1);

      const firstCard = cards.find((c: Card) => c.id === newFlippedCards[0]);
      const secondCard = cards.find((c: Card) => c.id === newFlippedCards[1]);

      if (!firstCard || !secondCard) return;

      // Check for match after a short delay
      setTimeout(() => {
        if (firstCard.emoji === secondCard.emoji) {
          // Cards match!
          setCards((prevCards: Card[]) =>
            prevCards.map((card: Card) => {
              const isNewMatch = newFlippedCards.includes(card.id);
              const wasAlreadyMatched = card.isMatched;
              return {
                ...card,
                isMatched: wasAlreadyMatched || isNewMatch,
                isFlipped: wasAlreadyMatched || isNewMatch, // Matched cards always stay flipped
              };
            })
          );

          const newMatches = matches + 1;
          setMatches(newMatches);
          setStreak((prev) => prev + 1);

          // Create match particles
          if (cardElement) {
            const rect = cardElement.getBoundingClientRect();
            createParticles(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              "#FFD700",
              12
            );
          }

          // Check if game is complete
          if (newMatches === difficultySettings[difficulty].pairs) {
            setGameComplete(true);
            setIsPlaying(false);

            const finalScore = calculateScore(
              moves + 1,
              timeElapsed,
              streak * 50
            );
            setScore(finalScore);

            // Update high score and XP
            if (session?.user?.id) {
              updateHighScoreAndXP(finalScore);
            }
          }
        } else {
          // Cards don't match - only flip back the unmatched cards
          setCards((prevCards: Card[]) =>
            prevCards.map((card: Card) => ({
              ...card,
              isFlipped: card.isMatched, // Only matched cards stay flipped
            }))
          );
          setStreak(0);
          setPerfectBonus(false);
        }
        setFlippedCards([]);
      }, 1000);
    }
  };

  const updateHighScoreAndXP = async (finalScore: number) => {
    if (!session?.user?.id || xpAwardedRef.current) return;

    try {
      xpAwardedRef.current = true; // Mark as awarded to prevent duplicates

      // Update high score
      if (finalScore > highScore) {
        await fetch("/api/games/highscore", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            game: "memory",
            score: finalScore,
          }),
        });
        setHighScore(finalScore);
      }

      // Award XP with toast notifications
      console.log("Memory game completed:", {
        score: finalScore,
        moves,
        timeElapsed,
        perfectBonus,
      });

      // Always award game play XP
      await awardGamePlayXP();

      // Award win XP for excellent performance (perfect bonus)
      if (perfectBonus) {
        await awardGameWinXP();
      }
    } catch (error) {
      console.error("Failed to update score/XP:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h1 className={styles.gameTitle}>
          <span className={styles.glowText}>Memory Master</span>
        </h1>
        <div className={styles.gameStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>High Score</span>
            <span className={styles.statValue}>
              {highScore.toLocaleString()}
            </span>
          </div>
          {gameStarted && (
            <>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Score</span>
                <span className={styles.statValue}>
                  {score.toLocaleString()}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Moves</span>
                <span className={styles.statValue}>{moves}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Time</span>
                <span className={styles.statValue}>
                  {formatTime(timeElapsed)}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Streak</span>
                <span className={styles.statValue}>{streak}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.gameArea}>
        {!gameStarted ? (
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
                    onClick={() =>
                      setDifficulty(key as "easy" | "medium" | "hard")
                    }>
                    <div className={styles.difficultyTitle}>
                      {key.toUpperCase()}
                    </div>
                    <div className={styles.difficultyInfo}>
                      {settings.pairs} pairs
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="mb-4 text-lg">Match pairs of cards to win!</p>
              <p className="mb-6 text-sm opacity-75">
                Perfect game bonus: +500 points • Streak bonus: +50 per match
              </p>
              <NeonButton onClick={shuffleCards}>Start Game</NeonButton>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.memoryGrid} data-difficulty={difficulty}>
              {cards.map((card: Card) => (
                <div
                  key={card.id}
                  data-card-id={card.id}
                  className={`${styles.memoryCard} ${styles.modernCard} ${
                    card.isFlipped ? styles.flipped : ""
                  } ${card.isMatched ? styles.matched : ""}`}
                  onClick={() => handleCardClick(card.id)}>
                  <div className={styles.memoryCardInner}>
                    <div className={styles.memoryCardFront}>
                      <div className={styles.cardPattern}></div>
                    </div>
                    <div className={styles.memoryCardBack}>
                      <span className={styles.cardEmoji}>{card.emoji}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {gameComplete && (
              <div className={styles.gameComplete}>
                <div className={styles.completionBurst}></div>
                <h3>🎉 Congratulations! 🎉</h3>
                <div className={styles.finalStats}>
                  <p>
                    <strong>Final Score:</strong> {score.toLocaleString()}
                  </p>
                  <p>
                    <strong>Moves:</strong> {moves}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(timeElapsed)}
                  </p>
                  <p>
                    <strong>Streak:</strong> {streak}
                  </p>
                  {perfectBonus && (
                    <p className={styles.perfectText}>
                      🌟 Perfect Game Bonus! 🌟
                    </p>
                  )}
                  {score > highScore && (
                    <p className={styles.newRecord}>🏆 New High Score! 🏆</p>
                  )}
                </div>
                <div className={styles.gameCompleteButtons}>
                  <NeonButton onClick={shuffleCards}>Play Again</NeonButton>
                  <NeonButton onClick={() => setGameStarted(false)}>
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
              style={{
                left: particle.x + "px",
                top: particle.y + "px",
                backgroundColor: particle.color,
                width: particle.size + "px",
                height: particle.size + "px",
                opacity: particle.life / particle.maxLife,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
