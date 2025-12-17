"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Theme,
  themes,
  getAvailableThemes,
  isThemeAvailable,
} from "@/config/themes";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  availableThemes: Theme[];
  userTier: "free" | "premium" | "pro";
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: themes[0],
  setTheme: () => {},
  themes: themes,
  availableThemes: [themes[0]],
  userTier: "free",
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [userTier, setUserTier] = useState<"free" | "premium" | "pro">("free");
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([themes[0]]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme from localStorage immediately after mounting
  useEffect(() => {
    if (!mounted) return;

    const initializeTheme = () => {
      try {
        // Try localStorage first
        let savedThemeId = localStorage.getItem("theme");

        // Fallback to window object if localStorage fails
        if (!savedThemeId && typeof window !== "undefined") {
          savedThemeId = (window as any).__THEME_ID__;
        }

        console.log("Initializing theme from localStorage:", savedThemeId);

        if (savedThemeId) {
          const theme = themes.find((t) => t.id === savedThemeId);
          if (theme) {
            console.log("Setting theme:", theme.name);
            setCurrentTheme(theme);
          } else {
            console.warn("Saved theme not found:", savedThemeId);
          }
        } else {
          console.log("No saved theme, using default");
        }
      } catch (error) {
        console.warn("Could not load saved theme:", error);
      }
      setIsLoading(false);

      // Remove theme loading class after theme is loaded
      setTimeout(() => {
        if (document.body) {
          document.body.classList.remove("theme-loading");
          document.body.classList.add("theme-loaded");
        }
      }, 50);
    };

    initializeTheme();
  }, [mounted]);

  // Load user subscription tier and update available themes
  useEffect(() => {
    const loadUserTier = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/subscription/status");
          if (response.ok) {
            const subscription = await response.json();
            const tier = subscription?.tier || "free";
            setUserTier(tier as "free" | "premium" | "pro");

            const available = getAvailableThemes(
              tier as "free" | "premium" | "pro"
            );
            setAvailableThemes(available);

            // Check if current theme is still available with new tier
            const savedThemeId = localStorage.getItem("theme");
            if (savedThemeId) {
              if (
                !isThemeAvailable(
                  savedThemeId,
                  tier as "free" | "premium" | "pro"
                )
              ) {
                // Reset to default theme if current theme is not available
                const defaultTheme = available[0] || themes[0];
                setCurrentTheme(defaultTheme);
                localStorage.setItem("theme", defaultTheme.id);
              }
            }
          } else {
            throw new Error("Failed to fetch subscription status");
          }
        } catch (error) {
          console.warn("Could not load user subscription:", error);
          // Fallback to free tier
          const available = getAvailableThemes("free");
          setAvailableThemes(available);
        }
      } else {
        // Not logged in, use free tier
        const available = getAvailableThemes("free");
        setAvailableThemes(available);
      }
    };

    if (!isLoading && mounted) {
      loadUserTier();
    }
  }, [session, isLoading, mounted]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--theme-primary-rgb",
      hexToRgb(currentTheme.colors.primary)
    );
    root.style.setProperty(
      "--theme-text-rgb",
      hexToRgb(currentTheme.colors.text)
    );
    root.style.setProperty(
      "--theme-border-rgb",
      hexToRgb(currentTheme.colors.text)
    );
  }, [currentTheme]);

  const hexToRgb = (hex: string) => {
    // Remove the # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  useEffect(() => {
    // Apply theme to CSS variables with logging for debugging
    console.log("Applying theme:", currentTheme.name);
    const root = document.documentElement;

    // Set color values
    root.style.setProperty(
      "--theme-background",
      currentTheme.colors.background
    );
    root.style.setProperty("--theme-text-primary", currentTheme.colors.text);
    root.style.setProperty(
      "--theme-text-secondary",
      currentTheme.colors.textSecondary
    );

    root.style.setProperty("--theme-card-bg", currentTheme.colors.cardBg);
    root.style.setProperty("--theme-card-border", currentTheme.colors.border);

    root.style.setProperty("--theme-primary", currentTheme.colors.primary);
    root.style.setProperty("--theme-secondary", currentTheme.colors.secondary);
    root.style.setProperty("--theme-accent", currentTheme.colors.accent);

    // Also apply to body to ensure it sticks across navigation
    if (document.body) {
      document.body.style.backgroundColor = currentTheme.colors.background;
      document.body.style.color = currentTheme.colors.text;
    }

    // Set gradient properties if available
    if (currentTheme.gradients) {
      root.style.setProperty(
        "--theme-gradient-primary",
        currentTheme.gradients.primary
      );
      root.style.setProperty(
        "--theme-gradient-secondary",
        currentTheme.gradients.secondary
      );
      root.style.setProperty(
        "--theme-gradient-accent",
        currentTheme.gradients.accent
      );
    } else {
      // Fallback gradients using solid colors
      root.style.setProperty(
        "--theme-gradient-primary",
        currentTheme.colors.primary
      );
      root.style.setProperty(
        "--theme-gradient-secondary",
        currentTheme.colors.secondary
      );
      root.style.setProperty(
        "--theme-gradient-accent",
        currentTheme.colors.accent
      );
    }

    // Set enhanced effect properties
    root.style.setProperty("--theme-glow", currentTheme.effects.glow);
    root.style.setProperty(
      "--theme-card-hover",
      currentTheme.effects.cardHover
    );

    // Convert colors to RGB for opacity support
    try {
      root.style.setProperty(
        "--theme-primary-rgb",
        hexToRgb(currentTheme.colors.primary)
      );
      root.style.setProperty(
        "--theme-secondary-rgb",
        hexToRgb(currentTheme.colors.secondary)
      );
      root.style.setProperty(
        "--theme-accent-rgb",
        hexToRgb(currentTheme.colors.accent)
      );
      root.style.setProperty(
        "--theme-card-bg-rgb",
        hexToRgb(currentTheme.colors.cardBg.replace(/[^0-9A-F]/gi, ""))
      );
    } catch (error) {
      console.warn("Could not convert some colors to RGB:", error);
    }
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    console.log("setTheme called with:", themeId);

    // Check if theme is available for user's tier
    if (!isThemeAvailable(themeId, userTier)) {
      console.warn(`Theme ${themeId} is not available for ${userTier} tier`);
      return;
    }

    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      console.log("Setting theme to:", theme.name);
      setCurrentTheme(theme);

      // Always save to localStorage immediately with multiple fallbacks
      try {
        localStorage.setItem("theme", themeId);

        // Also store on window object as backup for production
        if (typeof window !== "undefined") {
          (window as any).__THEME_ID__ = themeId;
        }

        console.log(`Theme saved: ${themeId}`);
      } catch (error) {
        console.warn("Could not save theme to localStorage:", error);
      }
    } else {
      console.warn("Theme not found:", themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes,
        availableThemes,
        userTier,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}
