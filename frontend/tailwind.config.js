/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        sea: "#0f766e",
        sand: "#f8fafc",
        coral: "#f97316"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.15)"
      }
    }
  },
  plugins: []
};
