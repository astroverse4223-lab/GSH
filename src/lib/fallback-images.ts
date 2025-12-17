// Utility functions for generating fallback images when external APIs fail

const COLORS = [
  "6366f1", // Indigo
  "f59e0b", // Amber
  "ef4444", // Red
  "10b981", // Emerald
  "8b5cf6", // Violet
  "f97316", // Orange
  "06b6d4", // Cyan
  "ec4899", // Pink
  "84cc16", // Lime
  "8b5a44", // Brown
];

/**
 * Get user image with fallback
 * Returns user's image if available, otherwise generates a fallback avatar
 */
export function getUserImageWithFallback(
  user?: { image?: string | null; name?: string | null; id?: string } | null
): string {
  // Check if user has a valid image (not a dicebear URL which might be failing)
  if (user?.image && !user.image.includes("api.dicebear.com")) {
    return user.image;
  }

  // Use name or id as seed for consistent colors
  const seed = user?.name || user?.id || "Unknown";
  return generateFallbackAvatar(seed);
}

/**
 * Generates a simple SVG fallback avatar based on a seed (name or id)
 */
export function generateFallbackAvatar(seed: string): string {
  const colorIndex = Math.abs(hashCode(seed)) % COLORS.length;
  const bgColor = COLORS[colorIndex];
  const letter = seed ? seed.charAt(0).toUpperCase() : "?";

  // Create a simple SVG with better encoding
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#${bgColor}"/>
    <text x="24" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">${letter}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Generate a fallback banner with gradient
 */
export function generateFallbackBanner(
  text: string,
  width: number = 1200,
  height: number = 400
): string {
  const colorIndex = text.length % COLORS.length;
  const primaryColor = COLORS[colorIndex];
  const secondaryColor = COLORS[(colorIndex + 1) % COLORS.length];

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#${secondaryColor};stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad${colorIndex})"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a fallback group icon with shapes
 */
export function generateFallbackGroupIcon(
  groupName: string,
  size: number = 200
): string {
  const colorIndex = groupName.length % COLORS.length;
  const color = COLORS[colorIndex];
  const initials = groupName.substring(0, 2).toUpperCase();

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="20" fill="#${color}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${
    size / 3
  }" fill="rgba(255,255,255,0.2)"/>
      <text x="${size / 2}" y="${
    size / 2 + size / 8
  }" font-family="Arial, sans-serif" font-size="${
    size / 3
  }" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
