import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import styles from "./ThemeSelector.module.css";

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes, userTier } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update CSS variables when theme changes
  useEffect(() => {
    if (!containerRef.current) return;

    const rgb = (color: string) => {
      // Convert hex to rgb values
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };

    const container = containerRef.current;
    container.style.setProperty(
      "--theme-primary",
      rgb(currentTheme.colors.primary)
    );
    container.style.setProperty(
      "--theme-secondary",
      rgb(currentTheme.colors.secondary)
    );
    container.style.setProperty(
      "--theme-accent",
      rgb(currentTheme.colors.accent)
    );
    container.style.setProperty("--theme-text", currentTheme.colors.text);
    container.style.setProperty(
      "--theme-background",
      rgb(currentTheme.colors.background)
    );
  }, [currentTheme]);

  const setThemeColors = useCallback(
    (element: HTMLDivElement | null, theme: any) => {
      if (!element) return;
      element.style.setProperty("--preview-primary", theme.colors.primary);
      element.style.setProperty("--preview-secondary", theme.colors.secondary);
    },
    []
  );

  const setSwatchColor = useCallback(
    (element: HTMLDivElement | null, color: string) => {
      if (!element) return;
      element.style.setProperty("--swatch-color", color);
    },
    []
  );

  return (
    <div ref={containerRef} className={styles.themeContainer}>
      <button
        onClick={toggleDropdown}
        className={`${styles.themeButton} ${isOpen ? styles.active : ""}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.themeIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
        <span>Theme</span>
      </button>

      {isOpen && (
        <div className={styles.themeDropdown}>
          {availableThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`${styles.themeOption} ${
                currentTheme.id === theme.id ? styles.active : ""
              }`}>
              <div className={styles.themePreview}>
                <div
                  ref={(el) => setThemeColors(el, theme)}
                  className={styles.themeColor}
                />
                <div className={styles.themeName}>
                  {theme.name}
                  {theme.tier !== "free" && (
                    <span className={styles.tierBadge}>
                      {theme.tier.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.themeColors}>
                  {[
                    theme.colors.primary,
                    theme.colors.secondary,
                    theme.colors.accent,
                  ].map((color, index) => (
                    <div
                      key={index}
                      ref={(el) => setSwatchColor(el, color)}
                      className={styles.colorSwatch}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
