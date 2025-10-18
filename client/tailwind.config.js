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
        redCard: {
          "0%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(220,38,38,0)",
          },
          "45%": {
            transform: "scale(1.05)",
            boxShadow: "0 0 22px rgba(220,38,38,0.45)",
          },
          "100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(220,38,38,0)",
          },
        },
        penalty: {
          "0%, 100%": {
            transform: "translateY(0) scale(1)",
          },
          "25%": {
            transform: "translateY(-8px) scale(1.03)",
          },
          "55%": {
            transform: "translateY(4px) scale(0.98)",
          },
        },
        winner: {
          "0%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(234,179,8,0)",
          },
          "40%": {
            transform: "scale(1.04)",
            boxShadow: "0 0 28px rgba(234,179,8,0.55)",
          },
          "100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(234,179,8,0)",
          },
        },
        draw: {
          "0%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(59,130,246,0)",
          },
          "35%": {
            transform: "scale(1.035)",
            boxShadow: "0 0 26px rgba(59,130,246,0.45)",
          },
          "70%": {
            transform: "scale(0.995)",
            boxShadow: "0 0 18px rgba(99,102,241,0.35)",
          },
          "100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(59,130,246,0)",
          },
        },
      },
      animation: {
        goal: "goal 1.2s ease-in-out",
        confetti: "confetti 2.5s ease-in-out forwards",
        "red-card": "redCard 1.3s ease-in-out",
        penalty: "penalty 1.3s ease-in-out",
        winner: "winner 2.1s ease-in-out",
        draw: "draw 2.4s ease-in-out",
      },
    },
  },
  plugins: [],
};
