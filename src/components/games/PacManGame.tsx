"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import type { Session } from "next-auth";

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: number;
  color: string;
  mode: "chase" | "scatter" | "frightened";
  modeTimer: number;
  name: string;
  moving: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const PacManGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
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
  const [particles, setParticles] = useState<Particle[]>([]);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const CELL_SIZE = 20;
  const PACMAN_SIZE = 18;
  const GHOST_SIZE = 18;
  const DOT_SIZE = 3;
  const POWER_PELLET_SIZE = 8;

  const pacmanRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    moving: boolean;
  }>({
    x: 400,
    y: 300,
    targetX: 400,
    targetY: 300,
    moving: false,
  });
  const pacmanDirectionRef = useRef<number>(0); // 0: right, 1: down, 2: left, 3: up
  const nextDirectionRef = useRef<number>(0);
  const ghostsRef = useRef<Ghost[]>([]);
  const dotsRef = useRef<boolean[][]>([]);
  const powerPelletsRef = useRef<Position[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frightenedTimerRef = useRef<number>(0);
  const mouthAnimationRef = useRef<number>(0);

  // Maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
  const maze = [
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1,
      1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    ],
    [
      1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1,
      1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 3, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1,
      1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      2, 0, 1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      2, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      2, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1,
    ],
    [
      1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 3, 1,
    ],
    [
      1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1,
      2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2,
      2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  ];

  // Helper functions for grid-based movement
  // Removed duplicate canMoveTo function declaration

  const snapToGrid = (pos: number) => Math.round(pos / CELL_SIZE) * CELL_SIZE;

  const getGridPosition = (x: number, y: number) => ({
    gridX: Math.floor(x / CELL_SIZE),
    gridY: Math.floor(y / CELL_SIZE),
  });

  const isAtGridCenter = (x: number, y: number) => {
    return x % CELL_SIZE === 0 && y % CELL_SIZE === 0;
  };

  const getNextGridPosition = (x: number, y: number, direction: number) => {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    switch (direction) {
      case 0: // right
        return { x: (gridX + 1) * CELL_SIZE, y: gridY * CELL_SIZE };
      case 1: // down
        return { x: gridX * CELL_SIZE, y: (gridY + 1) * CELL_SIZE };
      case 2: // left
        return { x: (gridX - 1) * CELL_SIZE, y: gridY * CELL_SIZE };
      case 3: // up
        return { x: gridX * CELL_SIZE, y: (gridY - 1) * CELL_SIZE };
      default:
        return { x, y };
    }
  };

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(
            `/api/games/highscore?game=pacman&userId=${session.user.id}`
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

  const initializeGame = useCallback(() => {
    // Reset XP awarded flag for new game
    xpAwardedRef.current = false;

    // Reset pacman position to grid-aligned position
    pacmanRef.current = {
      x: 400,
      y: 300,
      targetX: 400,
      targetY: 300,
      moving: false,
    };
    pacmanDirectionRef.current = 0;
    nextDirectionRef.current = 0;

    // Initialize ghosts with classic names and colors
    ghostsRef.current = [
      {
        x: 380,
        y: 240,
        targetX: 380,
        targetY: 240,
        direction: 0,
        color: "#FF0000",
        mode: "chase",
        modeTimer: 0,
        name: "Blinky",
        moving: false,
      },
      {
        x: 400,
        y: 240,
        targetX: 400,
        targetY: 240,
        direction: 1,
        color: "#FFB8FF",
        mode: "chase",
        modeTimer: 0,
        name: "Pinky",
        moving: false,
      },
      {
        x: 420,
        y: 240,
        targetX: 420,
        targetY: 240,
        direction: 2,
        color: "#00FFFF",
        mode: "chase",
        modeTimer: 0,
        name: "Inky",
        moving: false,
      },
      {
        x: 440,
        y: 240,
        targetX: 440,
        targetY: 240,
        direction: 3,
        color: "#FFB852",
        mode: "chase",
        modeTimer: 0,
        name: "Clyde",
        moving: false,
      },
    ];

    // Initialize dots and power pellets
    dotsRef.current = [];
    powerPelletsRef.current = [];

    for (let y = 0; y < maze.length; y++) {
      dotsRef.current[y] = [];
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 2) {
          dotsRef.current[y][x] = true;
        } else if (maze[y][x] === 3) {
          dotsRef.current[y][x] = false;
          powerPelletsRef.current.push({
            x: x * CELL_SIZE + 10,
            y: y * CELL_SIZE + 10,
          });
        } else {
          dotsRef.current[y][x] = false;
        }
      }
    }

    frightenedTimerRef.current = 0;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());

    // Set next direction based on key
    switch (e.key.toLowerCase()) {
      case "arrowright":
      case "d":
        nextDirectionRef.current = 0;
        break;
      case "arrowdown":
      case "s":
        nextDirectionRef.current = 1;
        break;
      case "arrowleft":
      case "a":
        nextDirectionRef.current = 2;
        break;
      case "arrowup":
      case "w":
        nextDirectionRef.current = 3;
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  const canMoveTo = useCallback((x: number, y: number): boolean => {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);

    // Handle vertical bounds
    if (cellY < 0 || cellY >= maze.length) {
      return false;
    }

    // Allow horizontal movement off-screen on tunnel row (row 12)
    if (cellY === 12) {
      // Allow any horizontal position on tunnel row
      if (cellX < 0 || cellX >= maze[0].length) {
        return true;
      }
    } else {
      // Normal bounds checking for non-tunnel rows
      if (cellX < 0 || cellX >= maze[0].length) {
        return false;
      }
    }

    // Check if the destination cell is not a wall
    return maze[cellY][cellX] !== 1;
  }, []);

  const updatePacman = useCallback(() => {
    const pacman = pacmanRef.current;
    const moveSpeed = 2; // Reduced speed for smoother grid movement

    // If we're not moving, try to start moving
    if (!pacman.moving) {
      // Snap to grid center if not already there
      if (!isAtGridCenter(pacman.x, pacman.y)) {
        pacman.x = snapToGrid(pacman.x);
        pacman.y = snapToGrid(pacman.y);
      }

      // Try to move in the requested direction first
      if (nextDirectionRef.current !== pacmanDirectionRef.current) {
        const nextPos = getNextGridPosition(
          pacman.x,
          pacman.y,
          nextDirectionRef.current
        );
        if (canMoveTo(nextPos.x, nextPos.y)) {
          pacmanDirectionRef.current = nextDirectionRef.current;
          pacman.targetX = nextPos.x;
          pacman.targetY = nextPos.y;
          pacman.moving = true;
        }
      }

      // If we couldn't change direction, try to continue in current direction
      if (!pacman.moving) {
        const nextPos = getNextGridPosition(
          pacman.x,
          pacman.y,
          pacmanDirectionRef.current
        );
        if (canMoveTo(nextPos.x, nextPos.y)) {
          pacman.targetX = nextPos.x;
          pacman.targetY = nextPos.y;
          pacman.moving = true;
        }
      }
    }

    // If we're moving, move towards target
    if (pacman.moving) {
      const dx = pacman.targetX - pacman.x;
      const dy = pacman.targetY - pacman.y;

      // Simple tunnel teleportation - check if moving off screen edges
      const mazeWidth = maze[0].length * CELL_SIZE;

      // Left edge teleportation
      if (pacman.x < 0) {
        pacman.x = mazeWidth - CELL_SIZE;
        pacman.targetX = mazeWidth - CELL_SIZE * 2;
        pacman.moving = true;
        return;
      }

      // Right edge teleportation
      if (pacman.x >= mazeWidth) {
        pacman.x = 0;
        pacman.targetX = CELL_SIZE;
        pacman.moving = true;
        return;
      }

      if (Math.abs(dx) <= moveSpeed && Math.abs(dy) <= moveSpeed) {
        // Reached target
        pacman.x = pacman.targetX;
        pacman.y = pacman.targetY;
        pacman.moving = false;
      } else {
        // Move towards target
        if (dx !== 0) {
          pacman.x += dx > 0 ? moveSpeed : -moveSpeed;
        }
        if (dy !== 0) {
          pacman.y += dy > 0 ? moveSpeed : -moveSpeed;
        }
      }
    }

    // Handle screen wrapping for tunnel effect
    if (pacman.x < -PACMAN_SIZE) {
      pacman.x = CANVAS_WIDTH;
      pacman.targetX = CANVAS_WIDTH;
    }
    if (pacman.x > CANVAS_WIDTH) {
      pacman.x = -PACMAN_SIZE;
      pacman.targetX = -PACMAN_SIZE;
    }
  }, [canMoveTo, snapToGrid, isAtGridCenter, getNextGridPosition]);

  const updateGhosts = useCallback(() => {
    const pacman = pacmanRef.current;

    ghostsRef.current.forEach((ghost) => {
      // Update mode timers
      ghost.modeTimer++;

      if (frightenedTimerRef.current > 0) {
        ghost.mode = "frightened";
      } else if (ghost.modeTimer > 1000) {
        ghost.mode = ghost.mode === "chase" ? "scatter" : "chase";
        ghost.modeTimer = 0;
      }

      const moveSpeed = ghost.mode === "frightened" ? 1 : 1.5;

      // If ghost is not moving, choose next direction
      if (!ghost.moving) {
        // Snap to grid if not already there
        if (!isAtGridCenter(ghost.x, ghost.y)) {
          ghost.x = snapToGrid(ghost.x);
          ghost.y = snapToGrid(ghost.y);
        }

        // Choose direction based on AI mode
        let bestDirection = ghost.direction;
        let bestDistance = Infinity;

        // Try all four directions
        for (let dir = 0; dir < 4; dir++) {
          // Don't reverse direction unless necessary
          if (dir === (ghost.direction + 2) % 4) continue;

          const nextPos = getNextGridPosition(ghost.x, ghost.y, dir);
          if (canMoveTo(nextPos.x, nextPos.y)) {
            let distance;

            if (ghost.mode === "chase") {
              // Move towards Pac-Man
              distance = Math.sqrt(
                Math.pow(nextPos.x - pacman.x, 2) +
                  Math.pow(nextPos.y - pacman.y, 2)
              );
            } else if (ghost.mode === "frightened") {
              // Move away from Pac-Man
              distance = -Math.sqrt(
                Math.pow(nextPos.x - pacman.x, 2) +
                  Math.pow(nextPos.y - pacman.y, 2)
              );
            } else {
              // Scatter mode - move to corners
              const cornerX = ghost.name === "Blinky" ? CANVAS_WIDTH : 0;
              const cornerY = ghost.name === "Pinky" ? 0 : CANVAS_HEIGHT;
              distance = Math.sqrt(
                Math.pow(nextPos.x - cornerX, 2) +
                  Math.pow(nextPos.y - cornerY, 2)
              );
            }

            if (distance < bestDistance) {
              bestDistance = distance;
              bestDirection = dir;
            }
          }
        }

        // Set target position
        const nextPos = getNextGridPosition(ghost.x, ghost.y, bestDirection);
        if (canMoveTo(nextPos.x, nextPos.y)) {
          ghost.direction = bestDirection;
          ghost.targetX = nextPos.x;
          ghost.targetY = nextPos.y;
          ghost.moving = true;
        }
      }

      // Move towards target if moving
      if (ghost.moving) {
        const dx = ghost.targetX - ghost.x;
        const dy = ghost.targetY - ghost.y;

        // Handle tunnel teleportation like Pac-Man
        const mazeWidth = maze[0].length * CELL_SIZE;

        // Left edge teleportation
        if (ghost.x < 0) {
          ghost.x = mazeWidth - CELL_SIZE;
          ghost.targetX = mazeWidth - CELL_SIZE * 2;
          ghost.moving = true;
          return;
        }

        // Right edge teleportation
        if (ghost.x >= mazeWidth) {
          ghost.x = 0;
          ghost.targetX = CELL_SIZE;
          ghost.moving = true;
          return;
        }

        if (Math.abs(dx) <= moveSpeed && Math.abs(dy) <= moveSpeed) {
          // Reached target
          ghost.x = ghost.targetX;
          ghost.y = ghost.targetY;
          ghost.moving = false;
        } else {
          // Move towards target
          if (dx !== 0) {
            ghost.x += dx > 0 ? moveSpeed : -moveSpeed;
          }
          if (dy !== 0) {
            ghost.y += dy > 0 ? moveSpeed : -moveSpeed;
          }
        }
      }

      // Handle screen wrapping for tunnel effect (same as Pac-Man)
      if (ghost.x < -GHOST_SIZE) {
        ghost.x = CANVAS_WIDTH;
        ghost.targetX = CANVAS_WIDTH;
      }
      if (ghost.x > CANVAS_WIDTH) {
        ghost.x = -GHOST_SIZE;
        ghost.targetX = -GHOST_SIZE;
      }
    });

    // Update frightened timer
    if (frightenedTimerRef.current > 0) {
      frightenedTimerRef.current--;
    }
  }, [canMoveTo, snapToGrid, isAtGridCenter, getNextGridPosition]);

  const handleGameEnd = async () => {
    if (session?.user?.id && !xpAwardedRef.current) {
      try {
        xpAwardedRef.current = true; // Mark XP as awarded at the start

        // Save high score via API
        const response = await fetch("/api/games/highscore", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game: "pacman",
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
        console.log("PacMan game ended with score:", score);

        // Always award game play XP
        await awardGamePlayXP();

        // Award win XP for good scores (1000+ points)
        if (score >= 1000) {
          await awardGameWinXP();
        }
      } catch (error) {
        console.error("Error saving game results:", error);
      }
    }
  };

  const checkCollisions = useCallback(() => {
    const pacman = pacmanRef.current;

    // Check dot collection
    const cellX = Math.floor(pacman.x / CELL_SIZE);
    const cellY = Math.floor(pacman.y / CELL_SIZE);

    if (
      cellY >= 0 &&
      cellY < dotsRef.current.length &&
      cellX >= 0 &&
      cellX < dotsRef.current[cellY].length &&
      dotsRef.current[cellY][cellX]
    ) {
      dotsRef.current[cellY][cellX] = false;
      setScore((prev) => prev + 10);

      // Add sparkle particles for dot collection
      const sparkleParticles: Particle[] = [];
      for (let i = 0; i < 5; i++) {
        sparkleParticles.push({
          x: cellX * CELL_SIZE + 10,
          y: cellY * CELL_SIZE + 10,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 20,
          color: "#FFFF00",
        });
      }
      setParticles((prev) => [...prev, ...sparkleParticles]);
    }

    // Check power pellet collection
    powerPelletsRef.current.forEach((pellet, index) => {
      const distance = Math.sqrt(
        Math.pow(pacman.x - pellet.x, 2) + Math.pow(pacman.y - pellet.y, 2)
      );

      if (distance < POWER_PELLET_SIZE + 5) {
        powerPelletsRef.current.splice(index, 1);
        setScore((prev) => prev + 50);
        frightenedTimerRef.current = 300; // 5 seconds at 60fps

        // Add power-up particles
        const powerParticles: Particle[] = [];
        for (let i = 0; i < 10; i++) {
          powerParticles.push({
            x: pellet.x,
            y: pellet.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: "#00FFFF",
          });
        }
        setParticles((prev) => [...prev, ...powerParticles]);
      }
    });

    // Check ghost collisions
    ghostsRef.current.forEach((ghost, index) => {
      const distance = Math.sqrt(
        Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2)
      );

      if (distance < PACMAN_SIZE) {
        if (ghost.mode === "frightened") {
          // Eat ghost
          setScore((prev) => prev + 200);

          // Create explosion particles
          const explosionParticles: Particle[] = [];
          for (let i = 0; i < 8; i++) {
            explosionParticles.push({
              x: ghost.x + GHOST_SIZE / 2,
              y: ghost.y + GHOST_SIZE / 2,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 25,
              color: ghost.color,
            });
          }
          setParticles((prev) => [...prev, ...explosionParticles]);

          // Reset ghost position
          ghost.x = 400;
          ghost.y = 240;
          ghost.targetX = 400;
          ghost.targetY = 240;
          ghost.moving = false;
          ghost.mode = "chase";
        } else {
          // Pacman dies
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState("gameOver");
              handleGameEnd();
            } else {
              // Reset positions
              pacmanRef.current = {
                x: 400,
                y: 300,
                targetX: 400,
                targetY: 300,
                moving: false,
              };
              initializeGame();
            }
            return newLives;
          });
        }
      }
    });

    // Check win condition (all dots collected)
    const allDotsEaten =
      dotsRef.current.every((row) => row.every((dot) => !dot)) &&
      powerPelletsRef.current.length === 0;

    if (allDotsEaten) {
      setLevel((prev) => prev + 1);
      setScore((prev) => prev + 1000); // Level bonus
      initializeGame();
    }
  }, [handleGameEnd, initializeGame]);

  const updateGame = useCallback(
    (currentTime: number) => {
      if (gameState !== "playing") return;

      const deltaTime = currentTime - lastTimeRef.current;

      // Limit to ~60fps
      if (deltaTime >= 16) {
        updatePacman();
        updateGhosts();
        checkCollisions();
        lastTimeRef.current = currentTime;
      }
    },
    [gameState, updatePacman, updateGhosts, checkCollisions]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with modern dark background
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_HEIGHT
    );
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f0f1b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw modern maze walls with glow effect
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur = 10;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 1) {
          const cellX = x * CELL_SIZE;
          const cellY = y * CELL_SIZE;

          ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);

          // Add inner glow
          ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
          ctx.fillRect(cellX + 2, cellY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
      }
    }

    ctx.shadowBlur = 0; // Reset shadow

    // Draw modern glowing dots
    for (let y = 0; y < dotsRef.current.length; y++) {
      for (let x = 0; x < dotsRef.current[y].length; x++) {
        if (dotsRef.current[y][x]) {
          ctx.fillStyle = "#FFFF00";
          ctx.shadowColor = "#FFFF00";
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + 10,
            y * CELL_SIZE + 10,
            DOT_SIZE,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw animated power pellets with pulsing effect
    const pulseScale = 1 + 0.3 * Math.sin(Date.now() * 0.01);
    powerPelletsRef.current.forEach((pellet) => {
      ctx.fillStyle = "#FFFF00";
      ctx.shadowColor = "#FFFF00";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        pellet.x,
        pellet.y,
        POWER_PELLET_SIZE * pulseScale,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw modern ghosts with rounded shapes and eyes
    ghostsRef.current.forEach((ghost) => {
      const ghostColor = ghost.mode === "frightened" ? "#0066FF" : ghost.color;

      // Ghost body with gradient
      const ghostGradient = ctx.createRadialGradient(
        ghost.x + GHOST_SIZE / 2,
        ghost.y + GHOST_SIZE / 2,
        0,
        ghost.x + GHOST_SIZE / 2,
        ghost.y + GHOST_SIZE / 2,
        GHOST_SIZE / 2
      );
      ghostGradient.addColorStop(0, ghostColor);
      ghostGradient.addColorStop(1, darkenColor(ghostColor, 0.3));

      ctx.fillStyle = ghostGradient;
      ctx.shadowColor = ghostColor;
      ctx.shadowBlur = 8;

      // Draw rounded ghost body
      ctx.beginPath();
      ctx.arc(
        ghost.x + GHOST_SIZE / 2,
        ghost.y + GHOST_SIZE / 3,
        GHOST_SIZE / 3,
        Math.PI,
        0
      );
      ctx.lineTo(ghost.x + GHOST_SIZE, ghost.y + GHOST_SIZE);
      ctx.lineTo(ghost.x + GHOST_SIZE * 0.8, ghost.y + GHOST_SIZE * 0.8);
      ctx.lineTo(ghost.x + GHOST_SIZE * 0.6, ghost.y + GHOST_SIZE);
      ctx.lineTo(ghost.x + GHOST_SIZE * 0.4, ghost.y + GHOST_SIZE * 0.8);
      ctx.lineTo(ghost.x + GHOST_SIZE * 0.2, ghost.y + GHOST_SIZE);
      ctx.lineTo(ghost.x, ghost.y + GHOST_SIZE);
      ctx.closePath();
      ctx.fill();

      // Draw eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ghost.x + 5, ghost.y + 6, 3, 0, Math.PI * 2);
      ctx.arc(ghost.x + 13, ghost.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupils
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(ghost.x + 5, ghost.y + 6, 1.5, 0, Math.PI * 2);
      ctx.arc(ghost.x + 13, ghost.y + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw modern Pac-Man with mouth animation
    const pacman = pacmanRef.current;
    mouthAnimationRef.current += 0.2;
    const mouthAngle = Math.abs(Math.sin(mouthAnimationRef.current)) * 0.8;

    ctx.fillStyle = "#FFFF00";
    ctx.shadowColor = "#FFFF00";
    ctx.shadowBlur = 12;

    ctx.beginPath();

    // Calculate mouth direction based on movement
    let startAngle, endAngle;
    switch (pacmanDirectionRef.current) {
      case 0: // right
        startAngle = mouthAngle;
        endAngle = Math.PI * 2 - mouthAngle;
        break;
      case 1: // down
        startAngle = Math.PI / 2 + mouthAngle;
        endAngle = Math.PI / 2 - mouthAngle + Math.PI * 2;
        break;
      case 2: // left
        startAngle = Math.PI + mouthAngle;
        endAngle = Math.PI - mouthAngle + Math.PI * 2;
        break;
      case 3: // up
        startAngle = Math.PI * 1.5 + mouthAngle;
        endAngle = Math.PI * 1.5 - mouthAngle + Math.PI * 2;
        break;
      default:
        startAngle = 0;
        endAngle = Math.PI * 2;
    }

    ctx.arc(
      pacman.x + PACMAN_SIZE / 2,
      pacman.y + PACMAN_SIZE / 2,
      PACMAN_SIZE / 2,
      startAngle,
      endAngle
    );

    if (mouthAngle > 0.1) {
      ctx.lineTo(pacman.x + PACMAN_SIZE / 2, pacman.y + PACMAN_SIZE / 2);
    }

    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw particles for visual effects
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
        ctx.fillRect(particle.x, particle.y, 2, 2);
      });
      ctx.globalAlpha = 1;

      return updatedParticles;
    });
  }, []);

  // Helper function to darken colors
  const darkenColor = (color: string, factor: number): string => {
    const hex = color.replace("#", "");
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  const gameLoop = useCallback(
    (currentTime: number) => {
      updateGame(currentTime);
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [updateGame, draw]
  );

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
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-yellow-900 to-black rounded-2xl shadow-xl">
      <div className="mb-6 flex gap-8 p-4 bg-gray-800 rounded-xl shadow-lg border-2 border-yellow-400">
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Score</span>
          <span className="text-2xl font-bold text-yellow-400">{score}</span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">
            High Score
          </span>
          <span className="text-2xl font-bold text-orange-400">
            {highScore}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Lives</span>
          <span className="text-2xl font-bold text-red-400">
            {"🟡".repeat(Math.max(0, lives))}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-300 font-medium">Level</span>
          <span className="text-2xl font-bold text-cyan-400">{level}</span>
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
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-xl border-2 border-yellow-300 shadow-lg">
          <p className="text-lg font-semibold text-yellow-300 mb-2">
            🟡 Use WASD or Arrow Keys to move!
          </p>
          <p className="text-gray-300">
            Collect all dots and power pellets while avoiding ghosts! 👻
          </p>
          <div className="mt-3 flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto mb-1"></div>
              <span className="text-yellow-400">Dot: 10pts</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mx-auto mb-1"></div>
              <span className="text-orange-400">Power: 50pts</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-blue-500 rounded-sm mx-auto mb-1"></div>
              <span className="text-blue-400">Ghost: 200pts</span>
            </div>
          </div>
        </div>

        {gameState === "gameOver" && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 p-6 rounded-xl border-2 border-red-400 shadow-lg">
            <h3 className="text-2xl font-bold text-red-200 mb-3">
              👻 Game Over!
            </h3>
            <p className="text-lg text-red-300 mb-3">
              Final Score:{" "}
              <span className="font-bold text-yellow-400">{score}</span>
            </p>
            {score > 0 && score === highScore && (
              <p className="text-sm text-orange-300 mb-3">🎉 New High Score!</p>
            )}
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg transform hover:scale-105">
              🎮 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacManGame;
