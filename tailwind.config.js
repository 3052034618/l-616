/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd3ff",
          300: "#8cb8ff",
          400: "#5592ff",
          500: "#2f6eff",
          600: "#1a4ff0",
          700: "#163dd6",
          800: "#1834ae",
          900: "#1e3a5f",
          950: "#0e1a33",
        },
        accent: {
          50: "#edfff9",
          100: "#d5fff2",
          200: "#aeffe5",
          300: "#70ffd3",
          400: "#2bf5ba",
          500: "#00c9a7",
          600: "#00a288",
          700: "#068170",
          800: "#0a665a",
          900: "#0c544b",
          950: "#012f2a",
        },
        warning: {
          50: "#fff4ed",
          100: "#ffe5d4",
          200: "#ffc6a8",
          300: "#ff9f70",
          400: "#ff7a45",
          500: "#f85a1c",
          600: "#e94010",
          700: "#c12d0e",
          800: "#9a2614",
          900: "#7c2315",
          950: "#430e08",
        },
        neutral: {
          50: "#f5f7fa",
          100: "#eaeef3",
          200: "#d0d9e3",
          300: "#a6b6c6",
          400: "#768da4",
          500: "#567088",
          600: "#43586f",
          700: "#374759",
          800: "#2c3e50",
          900: "#1a252f",
          950: "#0f161d",
        },
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "Noto Sans SC",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(0, 201, 167, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
