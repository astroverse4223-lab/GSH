export type GameScore = {
  gameId: string;
  score: number;
  date: Date;
  userId: string;
};

export type GameInfo = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  highScore?: number;
  personalBest?: number;
};

export const games: GameInfo[] = [
  {
    id: "clicker",
    name: "Speed Clicker 🎯",
    description: "Test your clicking speed in 10 seconds!",
    thumbnail: "🎯",
  },
  {
    id: "snake",
    name: "Neon Snake 🐍",
    description: "Classic snake game with a neon twist!",
    thumbnail: "🐍",
  },
  {
    id: "reaction",
    name: "Reaction Time ⚡",
    description: "Test your reflexes! Click when the screen turns green!",
    thumbnail: "⚡",
  },
  {
    id: "typing",
    name: "Speed Typer ⌨️",
    description: "How fast can you type? Test your WPM!",
    thumbnail: "⌨️",
  },
  {
    id: "space-shooter",
    name: "Space Shooter 🚀",
    description: "Defend Earth from alien invaders in this classic shooter!",
    thumbnail: "🚀",
  },
  {
    id: "frogger",
    name: "Frogger 🐸",
    description: "Help the frog cross the busy road and river!",
    thumbnail: "🐸",
  },
  {
    id: "pacman",
    name: "Pac-Man 👻",
    description: "Eat dots and avoid ghosts in this arcade classic!",
    thumbnail: "👻",
  },
  {
    id: "memory",
    name: "Memory Game 🧠",
    description: "Test your memory with this classic card matching game!",
    thumbnail: "🧠",
  },
];
