"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import type { Session } from "next-auth";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Car extends GameObject {
  speed: number;
  lane: number;
  color: string;
  type: string;
}

interface Log extends GameObject {
  speed: number;
  lane: number;
  color: string;
}

interface Frog extends GameObject {
  direction: number; // 0: up, 1: right, 2: down, 3: left
}

interface Lily extends GameObject {
  occupied: boolean;
}

const FroggerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const { data: session } = useSession();
  const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();
  const xpAwardedRef = useRef<boolean>(false); // Prevent duplicate XP awards

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const FROG_SIZE = 25;
  const LANE_HEIGHT = 50;

  // Game state
  const [gameState, setGameState] = useState<"playing" | "gameOver">("playing");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  // Game objects
  const frogRef = useRef<Frog>({
    x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
    y: CANVAS_HEIGHT - LANE_HEIGHT / 2 - FROG_SIZE / 2,
    width: FROG_SIZE,
    height: FROG_SIZE,
    direction: 0,
  });

  const carsRef = useRef<Car[]>([]);
  const logsRef = useRef<Log[]>([]);
  const liliesRef = useRef<Lily[]>([]);
  const keysRef = useRef<Set<string>>(new Set());

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(
            `/api/games/highscore?game=frogger&userId=${session.user.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setHighScore(data.score || 0);
          }
        } catch (error) {
          console.error("Error loading high score:", error);
        }
      }
    };
    loadHighScore();
  }, [session]);

  // Initialize game objects
  const initializeCars = () => {
    carsRef.current = [];
    const carColors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
    ];
    const carTypes = ["sedan", "truck", "sports"];

    for (let lane = 0; lane < 5; lane++) {
      const y = CANVAS_HEIGHT - (lane + 2) * LANE_HEIGHT - 15;
      const speed = (lane % 2 === 0 ? 2 : -2) * (1 + level * 0.2);
      const carCount = 2 + Math.floor(Math.random() * 2);
      const width = 50 + Math.random() * 30;
      const type = carTypes[Math.floor(Math.random() * carTypes.length)];

      for (let i = 0; i < carCount; i++) {
        carsRef.current.push({
          x: i * (CANVAS_WIDTH / carCount) + Math.random() * 100,
          y,
          width,
          height: 30,
          speed,
          lane,
          color: carColors[Math.floor(Math.random() * carColors.length)],
          type,
        });
      }
    }
  };

  const initializeLogs = () => {
    logsRef.current = [];
    const logColors = ["#8B4513", "#A0522D", "#CD853F"];

    for (let lane = 0; lane < 4; lane++) {
      const y = CANVAS_HEIGHT - (lane + 7) * LANE_HEIGHT - 15;
      const speed =
        (lane % 2 === 0 ? 1 : -1) * (1 + Math.random() * 1.5 + level * 0.3);
      const logCount = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < logCount; i++) {
        logsRef.current.push({
          x: i * (CANVAS_WIDTH / logCount) + Math.random() * 150,
          y,
          width: 100 + Math.random() * 50,
          height: 30,
          speed,
          lane,
          color: logColors[Math.floor(Math.random() * logColors.length)],
        });
      }
    }
  };

  const initializeLilies = () => {
    liliesRef.current = [];
    for (let i = 0; i < 5; i++) {
      liliesRef.current.push({
        x: i * 150 + 50,
        y: CANVAS_HEIGHT - 11 * LANE_HEIGHT + 10,
        width: 50,
        height: 30,
        occupied: false,
      });
    }
  };

  const initializeGame = useCallback(() => {
    initializeCars();
    initializeLogs();
    initializeLilies();

    frogRef.current = {
      x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
      y: CANVAS_HEIGHT - LANE_HEIGHT / 2 - FROG_SIZE / 2,
      width: FROG_SIZE,
      height: FROG_SIZE,
      direction: 0,
    };
  }, [level]);

  const handleGameEnd = useCallback(async () => {
    if (session?.user?.id && !xpAwardedRef.current) {
      try {
        xpAwardedRef.current = true; // Mark as awarded to prevent duplicates

        // Save high score via API
        const response = await fetch("/api/games/highscore", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game: "frogger",
            score: score,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save high score");
        }

        const highScoreData = await response.json();
        if (highScoreData.score > highScore) {
          setHighScore(highScoreData.score);
        }

        // Award XP with toast notifications
        console.log("Frogger game ended with score:", score);

        // Always award game play XP
        await awardGamePlayXP();

        // Award win XP for good scores (500+ points)
        if (score >= 500) {
          await awardGameWinXP();
        }
      } catch (error) {
        console.error("Error saving game results:", error);
      }
    }
  }, [session, score, highScore]);

  // Input handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  const moveFrog = useCallback(() => {
    const frog = frogRef.current;
    const moveDistance = LANE_HEIGHT;

    if (keysRef.current.has("arrowup") || keysRef.current.has("w")) {
      frog.y = Math.max(0, frog.y - moveDistance);
      frog.direction = 0;
      setScore((prev) => prev + 10);
      keysRef.current.delete("arrowup");
      keysRef.current.delete("w");
    }
    if (keysRef.current.has("arrowdown") || keysRef.current.has("s")) {
      frog.y = Math.min(CANVAS_HEIGHT - FROG_SIZE, frog.y + moveDistance);
      frog.direction = 2;
      keysRef.current.delete("arrowdown");
      keysRef.current.delete("s");
    }
    if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
      frog.x = Math.max(0, frog.x - moveDistance);
      frog.direction = 3;
      keysRef.current.delete("arrowleft");
      keysRef.current.delete("a");
    }
    if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
      frog.x = Math.min(CANVAS_WIDTH - FROG_SIZE, frog.x + moveDistance);
      frog.direction = 1;
      keysRef.current.delete("arrowright");
      keysRef.current.delete("d");
    }
  }, []);

  const checkCollisions = useCallback(() => {
    const frog = frogRef.current;

    // Check car collisions
    for (const car of carsRef.current) {
      if (
        frog.x < car.x + car.width - 5 &&
        frog.x + FROG_SIZE > car.x + 5 &&
        frog.y < car.y + car.height - 5 &&
        frog.y + FROG_SIZE > car.y + 5
      ) {
        return "car";
      }
    }

    // Check water drowning
    const waterStart = CANVAS_HEIGHT - 7 * LANE_HEIGHT;
    const waterEnd = CANVAS_HEIGHT - 11 * LANE_HEIGHT;

    if (frog.y < waterStart && frog.y > waterEnd) {
      let onLog = false;
      for (const log of logsRef.current) {
        if (
          frog.x < log.x + log.width - 10 &&
          frog.x + FROG_SIZE > log.x + 10 &&
          frog.y < log.y + log.height - 5 &&
          frog.y + FROG_SIZE > log.y + 5
        ) {
          onLog = true;
          // Move frog with log
          frog.x += log.speed;
          // Wrap around screen
          if (frog.x < -FROG_SIZE) frog.x = CANVAS_WIDTH;
          if (frog.x > CANVAS_WIDTH) frog.x = -FROG_SIZE;
          break;
        }
      }
      if (!onLog) return "water";
    }

    // Check lily pad collisions (win condition)
    if (frog.y <= 60) {
      for (let i = 0; i < liliesRef.current.length; i++) {
        const lily = liliesRef.current[i];
        if (
          frog.x < lily.x + lily.width &&
          frog.x + FROG_SIZE > lily.x &&
          frog.y < lily.y + lily.height &&
          frog.y + FROG_SIZE > lily.y &&
          !lily.occupied
        ) {
          lily.occupied = true;
          return "win";
        }
      }

      // Check if all lilies are occupied
      if (liliesRef.current.every((lily) => lily.occupied)) {
        return "level_complete";
      }
    }

    return null;
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;

    moveFrog();

    // Update cars
    carsRef.current.forEach((car) => {
      car.x += car.speed;
      if (car.x > CANVAS_WIDTH + 100) car.x = -100;
      if (car.x < -100) car.x = CANVAS_WIDTH + 100;
    });

    // Update logs
    logsRef.current.forEach((log) => {
      log.x += log.speed;
      if (log.x > CANVAS_WIDTH + 150) log.x = -150;
      if (log.x < -150) log.x = CANVAS_WIDTH + 150;
    });

    // Check collisions
    const collision = checkCollisions();
    if (collision === "car" || collision === "water") {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState("gameOver");
          handleGameEnd();
        } else {
          // Reset frog position
          frogRef.current = {
            x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
            y: CANVAS_HEIGHT - LANE_HEIGHT / 2 - FROG_SIZE / 2,
            width: FROG_SIZE,
            height: FROG_SIZE,
            direction: 0,
          };
        }
        return newLives;
      });
    } else if (collision === "win") {
      setScore((prev) => prev + 100 * level);
      frogRef.current = {
        x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
        y: CANVAS_HEIGHT - LANE_HEIGHT / 2 - FROG_SIZE / 2,
        width: FROG_SIZE,
        height: FROG_SIZE,
        direction: 0,
      };
    } else if (collision === "level_complete") {
      setScore((prev) => prev + 500 * level);
      setLevel((prev) => prev + 1);
      initializeGame();
      frogRef.current = {
        x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
        y: CANVAS_HEIGHT - LANE_HEIGHT / 2 - FROG_SIZE / 2,
        width: FROG_SIZE,
        height: FROG_SIZE,
        direction: 0,
      };
    }
  }, [gameState, level, moveFrog, checkCollisions, handleGameEnd]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.3, "#98D8E8");
    gradient.addColorStop(1, "#B0E0E6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grass areas
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 0, CANVAS_WIDTH, LANE_HEIGHT); // Top grass
    ctx.fillRect(0, CANVAS_HEIGHT - LANE_HEIGHT, CANVAS_WIDTH, LANE_HEIGHT); // Bottom grass
    ctx.fillRect(
      0,
      CANVAS_HEIGHT - 7 * LANE_HEIGHT - LANE_HEIGHT,
      CANVAS_WIDTH,
      LANE_HEIGHT
    ); // Middle grass

    // Draw road with lanes
    const roadGradient = ctx.createLinearGradient(
      0,
      CANVAS_HEIGHT - 7 * LANE_HEIGHT,
      0,
      CANVAS_HEIGHT - 2 * LANE_HEIGHT
    );
    roadGradient.addColorStop(0, "#2F2F2F");
    roadGradient.addColorStop(1, "#1A1A1A");
    ctx.fillStyle = roadGradient;
    ctx.fillRect(
      0,
      CANVAS_HEIGHT - 7 * LANE_HEIGHT,
      CANVAS_WIDTH,
      5 * LANE_HEIGHT
    );

    // Draw road lanes
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 1; i < 5; i++) {
      const y = CANVAS_HEIGHT - (2 + i) * LANE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw water with animated ripples
    const waterGradient = ctx.createLinearGradient(
      0,
      CANVAS_HEIGHT - 11 * LANE_HEIGHT,
      0,
      CANVAS_HEIGHT - 7 * LANE_HEIGHT
    );
    waterGradient.addColorStop(0, "#0066CC");
    waterGradient.addColorStop(0.5, "#0080FF");
    waterGradient.addColorStop(1, "#0066CC");
    ctx.fillStyle = waterGradient;
    ctx.fillRect(
      0,
      CANVAS_HEIGHT - 11 * LANE_HEIGHT,
      CANVAS_WIDTH,
      4 * LANE_HEIGHT
    );

    // Draw lily pads
    liliesRef.current.forEach((lily) => {
      ctx.fillStyle = lily.occupied ? "#32CD32" : "#228B22";
      ctx.beginPath();
      ctx.ellipse(
        lily.x + lily.width / 2,
        lily.y + lily.height / 2,
        lily.width / 2,
        lily.height / 2,
        0,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw lily pad center
      if (!lily.occupied) {
        ctx.fillStyle = "#006400";
        ctx.beginPath();
        ctx.ellipse(
          lily.x + lily.width / 2,
          lily.y + lily.height / 2,
          lily.width / 4,
          lily.height / 4,
          0,
          0,
          2 * Math.PI
        );
        ctx.fill();
      } else {
        // Draw checkmark for occupied lily
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lily.x + lily.width / 3, lily.y + lily.height / 2);
        ctx.lineTo(lily.x + lily.width / 2, lily.y + (2 * lily.height) / 3);
        ctx.lineTo(lily.x + (2 * lily.width) / 3, lily.y + lily.height / 3);
        ctx.stroke();
      }
    });

    // Draw cars with better graphics
    carsRef.current.forEach((car) => {
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x, car.y, car.width, car.height);

      // Add car details
      ctx.fillStyle = "#000000";
      // Windows
      ctx.fillRect(car.x + 5, car.y + 5, car.width - 10, car.height - 20);
      // Wheels
      ctx.beginPath();
      ctx.arc(car.x + 8, car.y + car.height - 3, 5, 0, 2 * Math.PI);
      ctx.arc(car.x + car.width - 8, car.y + car.height - 3, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Headlights for cars moving right
      if (car.speed > 0) {
        ctx.fillStyle = "#FFFF99";
        ctx.fillRect(car.x + car.width - 3, car.y + 8, 3, 6);
        ctx.fillRect(car.x + car.width - 3, car.y + car.height - 14, 3, 6);
      } else {
        ctx.fillStyle = "#FFFF99";
        ctx.fillRect(car.x, car.y + 8, 3, 6);
        ctx.fillRect(car.x, car.y + car.height - 14, 3, 6);
      }
    });

    // Draw logs with wood texture
    logsRef.current.forEach((log) => {
      ctx.fillStyle = log.color;
      ctx.fillRect(log.x, log.y, log.width, log.height);

      // Add wood rings
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(
          log.x + ((i + 1) * log.width) / 4,
          log.y + log.height / 2,
          8,
          log.height / 3,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }
    });

    // Draw frog with better animation
    const frog = frogRef.current;
    ctx.fillStyle = "#32CD32";

    // Frog body
    ctx.beginPath();
    ctx.ellipse(
      frog.x + FROG_SIZE / 2,
      frog.y + FROG_SIZE / 2,
      FROG_SIZE / 2,
      FROG_SIZE / 3,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Frog eyes
    ctx.fillStyle = "#000000";
    const eyeOffset = frog.direction === 0 ? -3 : frog.direction === 2 ? 3 : 0;
    const eyeOffsetX = frog.direction === 1 ? 3 : frog.direction === 3 ? -3 : 0;
    ctx.beginPath();
    ctx.arc(
      frog.x + FROG_SIZE / 3 + eyeOffsetX,
      frog.y + FROG_SIZE / 3 + eyeOffset,
      3,
      0,
      2 * Math.PI
    );
    ctx.arc(
      frog.x + (2 * FROG_SIZE) / 3 + eyeOffsetX,
      frog.y + FROG_SIZE / 3 + eyeOffset,
      3,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Frog legs (simple lines)
    ctx.strokeStyle = "#228B22";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (frog.direction === 0 || frog.direction === 2) {
      // Up/Down
      ctx.moveTo(frog.x + 5, frog.y + FROG_SIZE);
      ctx.lineTo(frog.x, frog.y + FROG_SIZE + 8);
      ctx.moveTo(frog.x + FROG_SIZE - 5, frog.y + FROG_SIZE);
      ctx.lineTo(frog.x + FROG_SIZE, frog.y + FROG_SIZE + 8);
    } else {
      // Left/Right
      ctx.moveTo(frog.x + FROG_SIZE, frog.y + 5);
      ctx.lineTo(frog.x + FROG_SIZE + 8, frog.y);
      ctx.moveTo(frog.x + FROG_SIZE, frog.y + FROG_SIZE - 5);
      ctx.lineTo(frog.x + FROG_SIZE + 8, frog.y + FROG_SIZE);
    }
    ctx.stroke();
  }, []);

  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  const resetGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setLevel(1);
    xpAwardedRef.current = false; // Reset XP awarded flag
    initializeGame();
  };

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-green-50 to-blue-50 rounded-2xl shadow-xl">
      <div className="mb-6 flex gap-8 p-4 bg-white rounded-xl shadow-lg border-2 border-blue-200">
        <div className="text-center">
          <span className="block text-sm text-gray-600 font-medium">Score</span>
          <span className="text-2xl font-bold text-blue-700">{score}</span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-600 font-medium">
            High Score
          </span>
          <span className="text-2xl font-bold text-yellow-600">
            {highScore}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-600 font-medium">Lives</span>
          <span className="text-2xl font-bold text-red-600">
            {"❤️".repeat(Math.max(0, lives))}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-600 font-medium">Level</span>
          <span className="text-2xl font-bold text-green-600">{level}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gradient rounded-xl shadow-2xl bg-gradient-to-b from-sky-200 to-blue-300"
        tabIndex={0}
      />

      <div className="mt-6 text-center space-y-4">
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-xl border-2 border-green-200 shadow-lg">
          <p className="text-lg font-semibold text-green-800 mb-2">
            🐸 Use WASD or Arrow Keys to hop!
          </p>
          <p className="text-gray-700">
            Cross the road and river safely to reach the lily pads! 🏆
          </p>
        </div>

        {gameState === "gameOver" && (
          <div className="bg-gradient-to-r from-red-100 to-orange-100 p-6 rounded-xl border-2 border-red-200 shadow-lg">
            <h3 className="text-2xl font-bold text-red-800 mb-3">
              🚫 Game Over!
            </h3>
            <p className="text-lg text-red-700 mb-3">
              Final Score: <span className="font-bold">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg transform hover:scale-105">
              🎮 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FroggerGame;
