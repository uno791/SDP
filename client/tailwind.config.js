/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // all React files
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fefae0",
      },
      keyframes: {
        goal: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "25%": { transform: "scale(1.3) rotate(-6deg)", opacity: "0.9" },
          "50%": { transform: "scale(1.5) rotate(6deg)", opacity: "1" },
          "75%": { transform: "scale(1.3) rotate(-6deg)", opacity: "0.95" },
        },
        confetti: {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "50%": { opacity: "1" },
          "100%": {
            transform: "translateY(100vh) rotate(720deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        goal: "goal 1.2s ease-in-out",
        confetti: "confetti 2.5s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
