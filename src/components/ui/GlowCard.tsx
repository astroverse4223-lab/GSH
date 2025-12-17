"use client";

import styles from "./GlowCard.module.css";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent";
  onClick?: () => void;
}

export function GlowCard({
  children,
  className = "",
  glowColor = "primary",
  onClick,
}: GlowCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        ${styles.card}
        ${className}
        glass-effect
        rounded-xl
        hover:bg-gray-800/90
        ${onClick ? "cursor-pointer" : ""}
      `}>
      {children}
    </div>
  );
}
