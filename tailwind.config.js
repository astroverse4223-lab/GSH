/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-primary": "var(--neon-primary)",
        "neon-secondary": "var(--neon-secondary)",
        "neon-accent": "var(--neon-accent)",
      },
      animation: {
        "glow-pulse": "glow-pulse 2s infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { "box-shadow": "0 0 15px var(--neon-primary)" },
          "50%": { "box-shadow": "0 0 25px var(--neon-primary)" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  plugins: [],
};
