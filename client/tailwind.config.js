/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 must include all your React files
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fefae0", // because you used text-cream
      },
    },
  },
  plugins: [],
};
