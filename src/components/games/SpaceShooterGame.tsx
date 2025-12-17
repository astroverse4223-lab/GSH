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

interface Bullet extends GameObject {
  dy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Enemy extends GameObject {
  dy: number;
  dx: number;
  health: number;
  type: "basic" | "fast" | "tank";
  color: string;
}

const SpaceShooterGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const { data: session } = useSession();
  const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();
  const xpAwardedRef = useRef<boolean>(false); // Prevent duplicate XP awards

  const [gameState, setGameState] = useState<"playing" | "gameOver" | "paused">(
    "playing"
  );
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]); // For explosion effects

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_WIDTH = 60;
  const PLAYER_HEIGHT = 40;
  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 10;
  const ENEMY_WIDTH = 50;
  const ENEMY_HEIGHT = 30;

  const playerRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const shootCooldownRef = useRef(0);

  // Loads the user's high score from the server when the session is available
  useEffect(() => {
    const loadHighScore = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(
            `/api/games/highscore?game=space-shooter&userId=${session.user.id}`
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

  // Initializes the game state, player, bullets, and enemies for a new game or level
  const initializeGame = useCallback(() => {
    playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    shootCooldownRef.current = 0;

    // Create initial enemies with different types
    const enemyTypes = ["basic", "fast", "tank"] as const;
    const enemyColors = {
      basic: "#FF4444",
      fast: "#FFAA00",
      tank: "#8B4513",
    };

    for (let i = 0; i < 5 + level; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const health = type === "tank" ? 3 : type === "fast" ? 1 : 2;
      const speed =
        type === "fast"
          ? 2 + level * 0.8
          : type === "tank"
          ? 0.5 + level * 0.2
          : 1 + level * 0.5;

      enemiesRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        y: -100 - i * 100,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        dy: speed,
        dx: (Math.random() - 0.5) * 2,
        health: health,
        type: type,
        color: enemyColors[type],
      });
    }
  }, [level]);

  // Handles keydown events for game controls and prevents default browser actions
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const gameKeys = [
      "arrowleft",
      "arrowright",
      "arrowup",
      "arrowdown",
      "a",
      "w",
      "s",
      "d",
      " ",
      "enter",
    ];

    if (gameKeys.includes(e.key.toLowerCase())) {
      e.preventDefault();
    }

    keysRef.current.add(e.key.toLowerCase());
  }, []);

  // Handles keyup events for game controls and prevents default browser actions
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const gameKeys = [
      "arrowleft",
      "arrowright",
      "arrowup",
      "arrowdown",
      "a",
      "w",
      "s",
      "d",
      " ",
      "enter",
    ];

    if (gameKeys.includes(e.key.toLowerCase())) {
      e.preventDefault();
    }

    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // Updates the player's position and handles shooting logic
  const updatePlayer = useCallback(() => {
    const player = playerRef.current;
    const moveSpeed = 5;

    if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
      player.x = Math.max(0, player.x - moveSpeed);
    }
    if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
      player.x = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, player.x + moveSpeed);
    }
    if (keysRef.current.has("arrowup") || keysRef.current.has("w")) {
      player.y = Math.max(0, player.y - moveSpeed);
    }
    if (keysRef.current.has("arrowdown") || keysRef.current.has("s")) {
      player.y = Math.min(CANVAS_HEIGHT - PLAYER_HEIGHT, player.y + moveSpeed);
    }

    // Shooting
    if (shootCooldownRef.current > 0) {
      shootCooldownRef.current--;
    }

    if (
      (keysRef.current.has(" ") || keysRef.current.has("enter")) &&
      shootCooldownRef.current <= 0
    ) {
      bulletsRef.current.push({
        x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: player.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        dy: -8,
      });
      shootCooldownRef.current = 10; // Cooldown frames
    }
  }, []);

  // Updates bullet positions and removes bullets that leave the screen
  const updateBullets = useCallback(() => {
    bulletsRef.current = bulletsRef.current.filter((bullet) => {
      bullet.y += bullet.dy;
      return bullet.y > -BULLET_HEIGHT;
    });
  }, []);

  // Updates enemy positions, handles wall bouncing, bottom collision, and spawns new enemies
  const updateEnemies = useCallback(() => {
    enemiesRef.current.forEach((enemy) => {
      enemy.y += enemy.dy;
      enemy.x += enemy.dx;

      // Bounce off walls
      if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - ENEMY_WIDTH) {
        enemy.dx *= -1;
      }

      // Check if enemy reached bottom
      if (enemy.y > CANVAS_HEIGHT) {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState("gameOver");
            handleGameEnd();
          }
          return newLives;
        });
        enemy.y = -ENEMY_HEIGHT;
        enemy.x = Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH);
      }
    });

    // Add new enemies periodically
    if (Math.random() < 0.02 + level * 0.005) {
      const enemyTypes = ["basic", "fast", "tank"] as const;
      const enemyColors = {
        basic: "#FF4444",
        fast: "#FFAA00",
        tank: "#8B4513",
      };
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const health = type === "tank" ? 3 : type === "fast" ? 1 : 2;
      const speed =
        type === "fast"
          ? 2 + level * 0.8
          : type === "tank"
          ? 0.5 + level * 0.2
          : 1 + level * 0.5;

      enemiesRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        dy: speed,
        dx: (Math.random() - 0.5) * 2,
        health: health,
        type: type,
        color: enemyColors[type],
      });
    }
  }, [level]);

  // Checks for collisions between bullets/enemies and player/enemies, handles scoring and level progression
  const checkCollisions = useCallback(() => {
    const player = playerRef.current;

    // Bullet-Enemy collisions
    bulletsRef.current.forEach((bullet, bulletIndex) => {
      enemiesRef.current.forEach((enemy, enemyIndex) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // Remove bullet
          bulletsRef.current.splice(bulletIndex, 1);

          // Damage enemy
          enemy.health--;
          if (enemy.health <= 0) {
            // Create explosion particles
            const explosionParticles: Particle[] = [];
            for (let p = 0; p < 8; p++) {
              explosionParticles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: enemy.color,
              });
            }
            setParticles((prev) => [...prev, ...explosionParticles]);

            enemiesRef.current.splice(enemyIndex, 1);
            const points =
              enemy.type === "tank" ? 300 : enemy.type === "fast" ? 150 : 200;
            setScore((prev) => prev + points);

            // Check level progression
            if (enemiesRef.current.length === 0) {
              setLevel((prev) => prev + 1);
              setScore((prev) => prev + 1000); // Level bonus
            }
          }
        }
      });
    });

    // Player-Enemy collisions
    enemiesRef.current.forEach((enemy) => {
      if (
        player.x < enemy.x + enemy.width &&
        player.x + PLAYER_WIDTH > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + PLAYER_HEIGHT > enemy.y
      ) {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState("gameOver");
            handleGameEnd();
          }
          return newLives;
        });

        // Reset player position
        playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60 };
      }
    });
  }, []);

  // Handles end-of-game logic: saves high score and awards XP to the user
  const handleGameEnd = async () => {
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
            game: "space-shooter",
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

        // Award XP via our notification system
        console.log("Space Shooter game ended with score:", score);

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
  };

  // Updates all game objects for the current frame
  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;

    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
  }, [gameState, updatePlayer, updateBullets, updateEnemies, checkCollisions]);

  // Draws all game objects and effects to the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with animated space background
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_HEIGHT
    );
    gradient.addColorStop(0, "#001122");
    gradient.addColorStop(0.5, "#000611");
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw animated stars
    ctx.fillStyle = "#FFFFFF";
    const time = Date.now() * 0.001;
    for (let i = 0; i < 150; i++) {
      const x = (i * 37 + time * 20) % CANVAS_WIDTH;
      const y = (i * 73 + time * 15) % CANVAS_HEIGHT;
      const brightness = 0.3 + 0.7 * Math.sin(time + i * 0.1);
      ctx.globalAlpha = brightness;
      ctx.fillRect(x, y, 1, 1);

      // Add some larger twinkling stars
      if (i % 10 === 0) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
    ctx.globalAlpha = 1;

    // Draw player with modern spaceship design
    const player = playerRef.current;

    // Player body with gradient
    const playerGradient = ctx.createLinearGradient(
      player.x,
      player.y,
      player.x,
      player.y + PLAYER_HEIGHT
    );
    playerGradient.addColorStop(0, "#00FFFF");
    playerGradient.addColorStop(0.5, "#0088FF");
    playerGradient.addColorStop(1, "#004488");
    ctx.fillStyle = playerGradient;

    // Main body
    ctx.beginPath();
    ctx.moveTo(player.x + PLAYER_WIDTH / 2, player.y);
    ctx.lineTo(player.x + PLAYER_WIDTH * 0.8, player.y + PLAYER_HEIGHT * 0.6);
    ctx.lineTo(player.x + PLAYER_WIDTH, player.y + PLAYER_HEIGHT);
    ctx.lineTo(player.x + PLAYER_WIDTH * 0.6, player.y + PLAYER_HEIGHT * 0.8);
    ctx.lineTo(player.x + PLAYER_WIDTH * 0.4, player.y + PLAYER_HEIGHT * 0.8);
    ctx.lineTo(player.x, player.y + PLAYER_HEIGHT);
    ctx.lineTo(player.x + PLAYER_WIDTH * 0.2, player.y + PLAYER_HEIGHT * 0.6);
    ctx.closePath();
    ctx.fill();

    // Player cockpit
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(
      player.x + PLAYER_WIDTH / 2,
      player.y + PLAYER_HEIGHT * 0.3,
      8,
      6,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Engine glow
    ctx.fillStyle = "#FF4400";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(
      player.x + PLAYER_WIDTH * 0.15,
      player.y + PLAYER_HEIGHT,
      PLAYER_WIDTH * 0.1,
      8
    );
    ctx.fillRect(
      player.x + PLAYER_WIDTH * 0.75,
      player.y + PLAYER_HEIGHT,
      PLAYER_WIDTH * 0.1,
      8
    );
    ctx.globalAlpha = 1;

    // Draw bullets with energy effect
    bulletsRef.current.forEach((bullet) => {
      // Bullet trail
      const bulletGradient = ctx.createLinearGradient(
        bullet.x,
        bullet.y,
        bullet.x,
        bullet.y + bullet.height
      );
      bulletGradient.addColorStop(0, "#FFFF00");
      bulletGradient.addColorStop(0.5, "#FFAA00");
      bulletGradient.addColorStop(1, "#FF4400");
      ctx.fillStyle = bulletGradient;

      // Main bullet
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      // Glow effect
      ctx.fillStyle = "#FFFF88";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(bullet.x - 1, bullet.y, bullet.width + 2, bullet.height);
      ctx.globalAlpha = 1;
    });

    // Draw enemies with different designs based on type
    enemiesRef.current.forEach((enemy) => {
      ctx.fillStyle = enemy.color;

      if (enemy.type === "basic") {
        // Basic enemy - diamond shape
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
        ctx.closePath();
        ctx.fill();
      } else if (enemy.type === "fast") {
        // Fast enemy - sleek triangle
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.closePath();
        ctx.fill();

        // Speed lines
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height + 5);
        ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height + 15);
        ctx.moveTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height + 5);
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height + 15);
        ctx.stroke();
      } else if (enemy.type === "tank") {
        // Tank enemy - heavy rectangular design
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Armor plating
        ctx.fillStyle = "#654321";
        ctx.fillRect(
          enemy.x + 5,
          enemy.y + 5,
          enemy.width - 10,
          enemy.height - 10
        );

        // Health indicator
        const healthWidth = (enemy.width - 10) * (enemy.health / 3);
        ctx.fillStyle = enemy.health > 1 ? "#00FF00" : "#FF0000";
        ctx.fillRect(enemy.x + 5, enemy.y + 2, healthWidth, 3);
      }

      // Enemy glow effect
      ctx.fillStyle = enemy.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
      ctx.globalAlpha = 1;
    });

    // Draw explosion particles
    setParticles((prevParticles) => {
      const updatedParticles = prevParticles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98,
        }))
        .filter((particle) => particle.life > 0);

      // Draw particles
      updatedParticles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, 3, 3);
      });
      ctx.globalAlpha = 1;

      return updatedParticles;
    });
  }, []);

  // Main game loop: updates and draws the game every animation frame
  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  // Resets the game to initial state for a new play session
  const resetGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setLevel(1);
    xpAwardedRef.current = false; // Reset XP awarded flag
    initializeGame();
  };

  // Initializes the game when the component mounts or when the level changes
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Starts and stops the game loop based on game state
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Sets up and cleans up keyboard event listeners for game controls
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-xl">
      <div className="mb-6 flex gap-8 p-4 bg-gray-800 rounded-xl shadow-lg border-2 border-blue-400">
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Score</span>
          <span className="text-2xl font-bold text-cyan-400">{score}</span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">
            High Score
          </span>
          <span className="text-2xl font-bold text-yellow-400">
            {highScore}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Lives</span>
          <span className="text-2xl font-bold text-red-400">
            {"🚀".repeat(Math.max(0, lives))}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Level</span>
          <span className="text-2xl font-bold text-green-400">{level}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gradient rounded-xl shadow-2xl bg-black"
        tabIndex={0}
      />

      <div className="mt-6 text-center space-y-4">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-xl border-2 border-cyan-300 shadow-lg">
          <p className="text-lg font-semibold text-cyan-300 mb-2">
            🚀 Use WASD or Arrow Keys to move, Space/Enter to shoot!
          </p>
          <p className="text-gray-300">
            Destroy all enemies to advance! Different enemies have different
            point values! 💥
          </p>
          <div className="mt-3 flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="w-4 h-4 bg-orange-500 mx-auto mb-1 transform rotate-45"></div>
              <span className="text-orange-400">Fast: 150pts</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-red-500 mx-auto mb-1 transform rotate-45"></div>
              <span className="text-red-400">Basic: 200pts</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-amber-800 mx-auto mb-1"></div>
              <span className="text-amber-600">Tank: 300pts</span>
            </div>
          </div>
        </div>

        {gameState === "gameOver" && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 p-6 rounded-xl border-2 border-red-400 shadow-lg">
            <h3 className="text-2xl font-bold text-red-200 mb-3">
              💥 Game Over!
            </h3>
            <p className="text-lg text-red-300 mb-3">
              Final Score:{" "}
              <span className="font-bold text-cyan-400">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg transform hover:scale-105">
              🎮 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceShooterGame;
