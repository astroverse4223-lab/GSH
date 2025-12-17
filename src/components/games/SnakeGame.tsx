"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./GameComponents.module.css";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };
type GameState = "READY" | "PLAYING" | "GAME_OVER";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = "UP";
const GAME_SPEED = 85; // Slightly faster for better responsiveness
const KEY_BUFFER_TIME = 16; // One frame (60 FPS) for more responsive input

export function SnakeGame() {
  const { data: session, status } = useSession();
  const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();
  const xpAwardedRef = useRef<boolean>(false); // Prevent duplicate XP awards
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [bufferedDirection, setBufferedDirection] = useState<Direction | null>(
    null
  );
  const [lastMoveTime, setLastMoveTime] = useState<number>(0);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("READY");
  const [highScore, setHighScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved high score when session is available
  useEffect(() => {
    const loadHighScore = async () => {
      if (status === "loading") return;

      if (session?.user?.id) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/games/highscore?game=snake`, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to load high score");
          }

          const data = await response.json();
          if (data && typeof data.score === "number") {
            setHighScore(data.score);
          }
        } catch (error) {
          console.error("Error loading high score:", error);
          setError(
            "Failed to load high score. Please try refreshing the page."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadHighScore();
  }, [session, status]);

  // Function to update high score on server
  const updateHighScore = async (newScore: number) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/games/highscore", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          game: "snake",
          score: newScore,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update high score");
      }

      const data = await response.json();
      if (data && typeof data.score === "number") {
        setHighScore(data.score);
      }
    } catch (error) {
      console.error("Error updating high score:", error);
      setError("Failed to save high score. Your score might not be saved.");
    }
  };

  // Function to award XP based on score
  const awardXP = async (finalScore: number) => {
    if (!session?.user?.id || finalScore === 0 || xpAwardedRef.current) return;

    try {
      xpAwardedRef.current = true; // Mark as awarded to prevent duplicates
      console.log("Snake game ended with score:", finalScore);

      // Always award game play XP
      await awardGamePlayXP();

      // Award win XP for good scores (50+ points)
      if (finalScore >= 50) {
        await awardGameWinXP();
      }
    } catch (error) {
      console.error("Failed to award XP:", error);
    }
  };

  const generateFood = useCallback(() => {
    while (true) {
      const newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };

      // Check if the food is not on the snake
      if (
        !snake.some(
          (segment) => segment.x === newFood.x && segment.y === newFood.y
        )
      ) {
        return newFood;
      }
    }
  }, [snake]);

  const isValidMove = useCallback(
    (newDir: Direction, currentDir: Direction) => {
      const invalidMoves = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      return invalidMoves[newDir] !== currentDir;
    },
    []
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState !== "PLAYING") return;

      const keyDirections: { [key: string]: Direction } = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
      };

      const newDirection = keyDirections[event.key];
      if (!newDirection) return;

      // Apply the direction change immediately if it's valid
      if (isValidMove(newDirection, direction)) {
        const now = Date.now();
        const timeSinceLastMove = now - lastMoveTime;

        if (timeSinceLastMove < KEY_BUFFER_TIME) {
          // Buffer the move only if we're very close to the next game tick
          setBufferedDirection(newDirection);
        } else {
          setDirection(newDirection);
          setBufferedDirection(null);
        }
      }
    },
    [direction, gameState, lastMoveTime, isValidMove]
  );

  const checkCollision = useCallback(
    (position: Position) => {
      // Wall collision
      if (
        position.x < 0 ||
        position.x >= GRID_SIZE ||
        position.y < 0 ||
        position.y >= GRID_SIZE
      ) {
        return true;
      }

      // Self collision (check all but the last segment, as it will move)
      for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === position.x && snake[i].y === position.y) {
          return true;
        }
      }

      return false;
    },
    [snake]
  );

  const moveSnake = useCallback(() => {
    setLastMoveTime(Date.now());
    const head = snake[0];
    const newHead = { ...head };

    // Apply buffered direction if it's valid
    if (bufferedDirection && isValidMove(bufferedDirection, direction)) {
      setDirection(bufferedDirection);
      setBufferedDirection(null);
    }

    switch (direction) {
      case "UP":
        newHead.y = (newHead.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case "DOWN":
        newHead.y = (newHead.y + 1) % GRID_SIZE;
        break;
      case "LEFT":
        newHead.x = (newHead.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case "RIGHT":
        newHead.x = (newHead.x + 1) % GRID_SIZE;
        break;
    }

    if (checkCollision(newHead)) {
      setGameState("GAME_OVER");
      if (score > highScore) {
        setHighScore(score);
        updateHighScore(score);
      }
      // Award XP based on score
      awardXP(score);
      return;
    }

    const newSnake = [newHead, ...snake];

    // Check if food is eaten
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore((s) => s + 10);
      setFood(generateFood());
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, generateFood, checkCollision, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and WASD
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "s",
          "a",
          "d",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }
      handleKeyPress(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake, gameState]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setBufferedDirection(null);
    setLastMoveTime(Date.now());
    setScore(0);
    setFood(generateFood());
    setGameState("PLAYING");
    xpAwardedRef.current = false; // Reset XP awarded flag
  };

  const renderCell = (x: number, y: number) => {
    const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
    const isHead = snake[0].x === x && snake[0].y === y;
    const isFood = food.x === x && food.y === y;

    // Find the segment index for body styling
    const segmentIndex = snake.findIndex(
      (segment) => segment.x === x && segment.y === y
    );

    let cellClass = styles.snakeCell;
    if (isHead) {
      cellClass += ` ${styles.snakeHead}`;
    } else if (isSnake) {
      cellClass += ` ${styles.snakeBody}`;
    } else if (isFood) {
      cellClass += ` ${styles.foodCell}`;
    } else {
      cellClass += ` ${styles.emptyCell}`;
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        data-segment={segmentIndex >= 0 ? segmentIndex : undefined}>
        {isHead && <span className={styles.snakeHeadEmoji}>🟢</span>}
        {!isHead && isSnake && <span className={styles.snakeBodyEmoji}>⬤</span>}
        {isFood && <span className={styles.foodEmoji}>🍎</span>}
      </div>
    );
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h1 className={styles.gameTitle}>
          <span className={styles.glowText}>Neon Snake</span>
        </h1>

        <div className={styles.gameStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>{score}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>High Score</span>
            <span className={styles.statValue}>
              {isLoading ? "..." : highScore}
            </span>
          </div>
          {gameState === "PLAYING" && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Length</span>
              <span className={styles.statValue}>{snake.length}</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.gameArea}>
        {gameState === "READY" ? (
          <div className={styles.gameMenu}>
            <div className={styles.menuContent}>
              <h2>🐍 Ready to Slither?</h2>
              <p className="mb-4">
                Control the snake and eat as many apples as you can!
              </p>
              <div className={styles.controlsInfo}>
                <p>
                  <span className={styles.keyHighlight}>Arrow Keys</span> or{" "}
                  <span className={styles.keyHighlight}>WASD</span> to move
                </p>
                <p>Don't hit the walls or yourself!</p>
              </div>
              <NeonButton onClick={startGame}>Start Game</NeonButton>
            </div>
          </div>
        ) : gameState === "GAME_OVER" ? (
          <div className={styles.gameResults}>
            <div className={styles.completionBurst}></div>
            <div className={styles.explosionEffect}></div>
            <h2>🎮 Game Over!</h2>

            <div className={styles.finalStats}>
              <div className={styles.statGrid}>
                <div className={styles.finalStat}>
                  <span className={styles.finalStatLabel}>Final Score</span>
                  <span className={styles.finalStatValue}>{score}</span>
                </div>
                <div className={styles.finalStat}>
                  <span className={styles.finalStatLabel}>Snake Length</span>
                  <span className={styles.finalStatValue}>{snake.length}</span>
                </div>
                <div className={styles.finalStat}>
                  <span className={styles.finalStatLabel}>High Score</span>
                  <span className={styles.finalStatValue}>{highScore}</span>
                </div>
              </div>
            </div>

            {score === highScore && score > 0 && (
              <p className={styles.newRecord}>🏆 New High Score! �</p>
            )}

            <div className={styles.gameCompleteButtons}>
              <NeonButton onClick={startGame}>Play Again</NeonButton>
            </div>
          </div>
        ) : (
          <div className={styles.snakeGameContainer}>
            <div className={styles.snakeGrid}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                return renderCell(x, y);
              })}
            </div>

            {gameState === "PLAYING" && (
              <div className={styles.gameInfo}>
                <div className={styles.controlsHint}>
                  <span className={styles.hintText}>
                    Use <span className={styles.keyHighlight}>↑↓←→</span> or{" "}
                    <span className={styles.keyHighlight}>WASD</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
