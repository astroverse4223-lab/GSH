"use client";

import React, { useEffect, useRef } from "react";
import styles from "./ParticleBackground.module.css";
import { useTheme } from "./ThemeProvider";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  isTrail?: boolean;
  life?: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mouseX = 0;
    let mouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let animationId: number;

    // Set canvas size to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    // Create particles
    const particles: Particle[] = [];
    const particleCount = Math.min(window.innerWidth * 0.1, 100);

    // Convert hex to rgba with opacity
    const hexToRgba = (hex: string, opacity: number = 1): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Get theme colors for particles
    const getThemeColors = () => {
      return {
        primary: hexToRgba(currentTheme.colors.primary),
        secondary: hexToRgba(currentTheme.colors.secondary),
        accent: hexToRgba(currentTheme.colors.accent),
        highlight: hexToRgba(currentTheme.colors.highlight),
      };
    };

    let themeColors = getThemeColors();

    // Create initial particles with theme colors
    const createParticle = (
      x?: number,
      y?: number,
      isTrail = false
    ): Particle => {
      const colors = [
        themeColors.primary,
        themeColors.secondary,
        themeColors.accent,
        themeColors.highlight,
      ];

      return {
        x: x ?? Math.random() * canvas.width,
        y: y ?? Math.random() * canvas.height,
        size: Math.random() * 3 + 1.5,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        opacity: isTrail ? 0.8 : Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        isTrail,
        life: isTrail ? 1.0 : undefined,
      };
    };

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update theme colors in case theme changed
      themeColors = getThemeColors();

      // Add trail particles if mouse has moved
      if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const numParticles = Math.min(Math.floor(distance / 5), 5);

        for (let i = 0; i < numParticles; i++) {
          const ratio = i / numParticles;
          particles.push(
            createParticle(
              lastMouseX + dx * ratio,
              lastMouseY + dy * ratio,
              true
            )
          );
        }

        lastMouseX = mouseX;
        lastMouseY = mouseY;
      }

      // Update and filter particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        if (particle.isTrail) {
          particle.life! -= 0.02;
          particle.opacity = particle.life!;
          if (particle.life! <= 0) {
            particles.splice(i, 1);
            continue;
          }
        } else {
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          particle.pulse += particle.pulseSpeed;

          // Wrap around screen edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;
        }

        const pulseScale = 1 + Math.sin(particle.pulse) * 0.2;
        const currentSize = particle.size * pulseScale;

        // Draw glowing particle with theme colors
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          currentSize * 4
        );

        const baseColor = particle.color
          .replace("rgba(", "")
          .replace(")", "")
          .split(",");
        const r = baseColor[0];
        const g = baseColor[1];
        const b = baseColor[2];

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.2)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = particle.opacity * 0.6;
        ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner core
        const innerGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          currentSize
        );
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        innerGradient.addColorStop(0.4, particle.color);
        innerGradient.addColorStop(1, particle.color);

        ctx.beginPath();
        ctx.fillStyle = innerGradient;
        ctx.globalAlpha = particle.opacity;
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [currentTheme]); // Re-run effect when theme changes

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
};
