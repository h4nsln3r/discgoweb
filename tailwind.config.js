/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ["var(--font-bebas)", "sans-serif"],
      },
      colors: {
        retro: {
          bg: "#1c1917",
          surface: "#292524",
          card: "#44403c",
          border: "#57534e",
          muted: "#a8a29e",
          accent: "#d97706",
          "accent-hover": "#b45309",
        },
      },
    },
  },
  plugins: [],
};
