export interface Theme {
  id: string;
  name: string;
  tier: "free" | "premium" | "pro"; // Subscription tier required
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    border: string;
    highlight: string;
  };
  effects: {
    glow: string;
    cardHover: string;
  };
  gradients?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Apex Legends",
    tier: "free", // Available to all users
    colors: {
      primary: "#FF6B1A", // Apex orange
      secondary: "#0066CC", // Electric blue
      accent: "#FF3366", // Hot pink
      background: "#0A0A0F", // Deep space black
      cardBg: "rgba(26, 27, 38, 0.8)", // Translucent dark
      text: "#FFFFFF", // Pure white
      textSecondary: "#B8BCC8", // Light gray
      border: "#FF6B1A", // Apex orange
      highlight: "#FF3366", // Hot pink
    },
    effects: {
      glow: "0 0 30px rgba(255, 107, 26, 0.4), 0 0 60px rgba(255, 107, 26, 0.2)",
      cardHover:
        "0 10px 40px rgba(255, 107, 26, 0.15), 0 0 20px rgba(255, 51, 102, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF6B1A 0%, #FF3366 100%)",
      secondary: "linear-gradient(135deg, #0066CC 0%, #00BFFF 100%)",
      accent: "linear-gradient(135deg, #FF3366 0%, #FF1493 100%)",
    },
  },
  {
    id: "valorant",
    name: "Valorant Strike",
    tier: "premium", // Premium theme
    colors: {
      primary: "#FF4655", // Valorant red
      secondary: "#00F5FF", // Cyan
      accent: "#FFCD00", // Gold
      background: "#0F1419", // Valorant dark
      cardBg: "rgba(21, 25, 34, 0.9)", // Dark translucent
      text: "#FFFFFF", // White
      textSecondary: "#9CA3AF", // Cool gray
      border: "#FF4655", // Valorant red
      highlight: "#FFCD00", // Gold
    },
    effects: {
      glow: "0 0 25px rgba(255, 70, 85, 0.5), 0 0 50px rgba(255, 70, 85, 0.2)",
      cardHover:
        "0 8px 35px rgba(255, 70, 85, 0.2), 0 0 15px rgba(255, 205, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF4655 0%, #FF6B7A 100%)",
      secondary: "linear-gradient(135deg, #00F5FF 0%, #0080FF 100%)",
      accent: "linear-gradient(135deg, #FFCD00 0%, #FFD700 100%)",
    },
  },
  {
    id: "cyberpunk2077",
    name: "Night City",
    tier: "premium", // Premium theme
    colors: {
      primary: "#FCEE09", // Cyber yellow
      secondary: "#00F0FF", // Electric cyan
      accent: "#FF003C", // Hot magenta
      background: "#0A0A0A", // Pure black
      cardBg: "rgba(19, 19, 19, 0.95)", // Almost black
      text: "#00F0FF", // Electric cyan
      textSecondary: "#FCEE09", // Cyber yellow
      border: "#FCEE09", // Cyber yellow
      highlight: "#FF003C", // Hot magenta
    },
    effects: {
      glow: "0 0 20px rgba(252, 238, 9, 0.6), 0 0 40px rgba(0, 240, 255, 0.3)",
      cardHover:
        "0 12px 50px rgba(255, 0, 60, 0.2), 0 0 30px rgba(252, 238, 9, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FCEE09 0%, #FFD700 100%)",
      secondary: "linear-gradient(135deg, #00F0FF 0%, #0080FF 100%)",
      accent: "linear-gradient(135deg, #FF003C 0%, #FF1493 100%)",
    },
  },
  {
    id: "fortnite",
    name: "Battle Royale",
    tier: "premium", // Premium theme
    colors: {
      primary: "#00D4FF", // Fortnite blue
      secondary: "#8A2BE2", // Blue violet
      accent: "#FFD700", // Victory gold
      background: "#0E0E23", // Deep purple-black
      cardBg: "rgba(20, 20, 45, 0.85)", // Purple tint
      text: "#FFFFFF", // White
      textSecondary: "#B8A9FF", // Light purple
      border: "#00D4FF", // Fortnite blue
      highlight: "#FFD700", // Victory gold
    },
    effects: {
      glow: "0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(138, 43, 226, 0.3)",
      cardHover:
        "0 10px 40px rgba(0, 212, 255, 0.15), 0 0 20px rgba(255, 215, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #00D4FF 0%, #0080FF 100%)",
      secondary: "linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%)",
      accent: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    },
  },
  {
    id: "matrix",
    name: "Digital Rain",
    tier: "premium", // Premium theme
    colors: {
      primary: "#00FF41", // Matrix green
      secondary: "#008F11", // Dark matrix green
      accent: "#39FF14", // Neon green
      background: "#000000", // Pure black
      cardBg: "rgba(0, 20, 0, 0.9)", // Dark green tint
      text: "#00FF41", // Matrix green
      textSecondary: "#00CC33", // Darker green
      border: "#00FF41", // Matrix green
      highlight: "#39FF14", // Neon green
    },
    effects: {
      glow: "0 0 20px rgba(0, 255, 65, 0.7), 0 0 40px rgba(57, 255, 20, 0.4)",
      cardHover:
        "0 8px 30px rgba(0, 255, 65, 0.2), 0 0 15px rgba(57, 255, 20, 0.3)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #00FF41 0%, #39FF14 100%)",
      secondary: "linear-gradient(135deg, #008F11 0%, #00FF41 100%)",
      accent: "linear-gradient(135deg, #39FF14 0%, #00FF00 100%)",
    },
  },
  {
    id: "synthwave",
    name: "Synthwave Dreams",
    tier: "premium", // Premium theme
    colors: {
      primary: "#FF1B8D", // Hot pink
      secondary: "#00D9FF", // Cyan
      accent: "#FFD700", // Gold
      background: "#0A0015", // Deep purple-black
      cardBg: "rgba(20, 0, 30, 0.9)", // Purple translucent
      text: "#FFFFFF", // White
      textSecondary: "#FF1B8D", // Hot pink
      border: "#FF1B8D", // Hot pink
      highlight: "#00D9FF", // Cyan
    },
    effects: {
      glow: "0 0 25px rgba(255, 27, 141, 0.6), 0 0 50px rgba(0, 217, 255, 0.3)",
      cardHover:
        "0 12px 45px rgba(255, 27, 141, 0.2), 0 0 25px rgba(255, 215, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF1B8D 0%, #FF69B4 100%)",
      secondary: "linear-gradient(135deg, #00D9FF 0%, #87CEEB 100%)",
      accent: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    },
  },
  {
    id: "witcher",
    name: "Wolf School",
    tier: "pro", // Pro theme
    colors: {
      primary: "#FFA500", // Amber/Orange
      secondary: "#4B0082", // Indigo
      accent: "#DC143C", // Crimson
      background: "#0C0C0C", // Almost black
      cardBg: "rgba(25, 25, 25, 0.9)", // Dark gray
      text: "#F5DEB3", // Wheat
      textSecondary: "#CD853F", // Peru
      border: "#FFA500", // Amber/Orange
      highlight: "#DC143C", // Crimson
    },
    effects: {
      glow: "0 0 20px rgba(255, 165, 0, 0.5), 0 0 40px rgba(220, 20, 60, 0.3)",
      cardHover:
        "0 10px 35px rgba(255, 165, 0, 0.15), 0 0 20px rgba(75, 0, 130, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)",
      secondary: "linear-gradient(135deg, #4B0082 0%, #8A2BE2 100%)",
      accent: "linear-gradient(135deg, #DC143C 0%, #B22222 100%)",
    },
  },
  {
    id: "ghostrunner",
    name: "Neon Runner",
    tier: "pro", // Pro theme
    colors: {
      primary: "#FF0080", // Electric magenta
      secondary: "#00FFFF", // Pure cyan
      accent: "#FFFF00", // Electric yellow
      background: "#000014", // Deep space blue
      cardBg: "rgba(10, 10, 30, 0.95)", // Dark blue tint
      text: "#FFFFFF", // White
      textSecondary: "#00FFFF", // Pure cyan
      border: "#FF0080", // Electric magenta
      highlight: "#FFFF00", // Electric yellow
    },
    effects: {
      glow: "0 0 30px rgba(255, 0, 128, 0.6), 0 0 60px rgba(0, 255, 255, 0.4)",
      cardHover:
        "0 15px 50px rgba(255, 0, 128, 0.2), 0 0 30px rgba(255, 255, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF0080 0%, #FF1493 100%)",
      secondary: "linear-gradient(135deg, #00FFFF 0%, #00BFFF 100%)",
      accent: "linear-gradient(135deg, #FFFF00 0%, #FFD700 100%)",
    },
  },
  {
    id: "darksouls",
    name: "Ashen One",
    tier: "pro", // Pro theme
    colors: {
      primary: "#8B4513", // Saddle brown
      secondary: "#B8860B", // Dark goldenrod
      accent: "#FF4500", // Orange red
      background: "#000000", // Pure black
      cardBg: "rgba(20, 15, 10, 0.95)", // Dark brown tint
      text: "#F5DEB3", // Wheat
      textSecondary: "#DEB887", // Burlywood
      border: "#B8860B", // Dark goldenrod
      highlight: "#FF4500", // Orange red
    },
    effects: {
      glow: "0 0 20px rgba(139, 69, 19, 0.5), 0 0 40px rgba(255, 69, 0, 0.3)",
      cardHover:
        "0 8px 30px rgba(184, 134, 11, 0.2), 0 0 15px rgba(255, 69, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
      secondary: "linear-gradient(135deg, #B8860B 0%, #DAA520 100%)",
      accent: "linear-gradient(135deg, #FF4500 0%, #FF6347 100%)",
    },
  },
  {
    id: "halo",
    name: "Spartan Blue",
    tier: "pro", // Pro theme
    colors: {
      primary: "#0073E6", // Halo blue
      secondary: "#00FF00", // Master Chief green
      accent: "#FF8C00", // Orange
      background: "#000019", // Deep space
      cardBg: "rgba(0, 20, 40, 0.9)", // Navy blue tint
      text: "#FFFFFF", // White
      textSecondary: "#87CEEB", // Sky blue
      border: "#0073E6", // Halo blue
      highlight: "#00FF00", // Master Chief green
    },
    effects: {
      glow: "0 0 25px rgba(0, 115, 230, 0.5), 0 0 50px rgba(0, 255, 0, 0.3)",
      cardHover:
        "0 10px 40px rgba(0, 115, 230, 0.15), 0 0 20px rgba(255, 140, 0, 0.1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #0073E6 0%, #0099FF 100%)",
      secondary: "linear-gradient(135deg, #00FF00 0%, #32CD32 100%)",
      accent: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
    },
  },
];

// Helper function to get available themes based on subscription tier
export const getAvailableThemes = (
  userTier: "free" | "premium" | "pro" = "free"
): Theme[] => {
  return themes.filter((theme) => {
    switch (userTier) {
      case "free":
        return theme.tier === "free";
      case "premium":
        return theme.tier === "free" || theme.tier === "premium";
      case "pro":
        return true; // Pro users get all themes
      default:
        return theme.tier === "free";
    }
  });
};

// Helper function to check if a theme is available for a user's tier
export const isThemeAvailable = (
  themeId: string,
  userTier: "free" | "premium" | "pro" = "free"
): boolean => {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return false;

  const availableThemes = getAvailableThemes(userTier);
  return availableThemes.some((t) => t.id === themeId);
};
