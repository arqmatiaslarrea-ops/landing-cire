import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        whatsapp: {
          DEFAULT: "hsl(var(--whatsapp))",
          hover: "hsl(var(--whatsapp-hover))",
          foreground: "hsl(var(--whatsapp-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cire: {
          orange: "hsl(var(--cire-orange))",
          "orange-light": "hsl(var(--cire-orange-light))",
          "orange-soft": "hsl(var(--cire-orange-soft))",
          "orange-muted": "hsl(var(--cire-orange-muted))",
          "orange-deep": "hsl(var(--cire-orange-deep))",
          blue: "hsl(var(--cire-blue))",
          "blue-deep": "hsl(var(--cire-blue-deep))",
          "blue-darker": "hsl(var(--cire-blue-darker))",
          "blue-light": "hsl(var(--cire-blue-light))",
          "blue-soft": "hsl(var(--cire-blue-soft))",
          "blue-muted": "hsl(var(--cire-blue-muted))",
          yellow: "hsl(var(--cire-yellow))",
          "yellow-soft": "hsl(var(--cire-yellow-soft))",
          "yellow-muted": "hsl(var(--cire-yellow-muted))",
        },
        warm: {
          white: "hsl(var(--warm-white))",
          50: "hsl(var(--warm-gray-50))",
          100: "hsl(var(--warm-gray-100))",
          200: "hsl(var(--warm-gray-200))",
          300: "hsl(var(--warm-gray-300))",
          400: "hsl(var(--warm-gray-400))",
          500: "hsl(var(--warm-gray-500))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "100%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px -5px hsl(10 92% 59% / 0.4)" },
          "50%": { boxShadow: "0 0 30px -5px hsl(10 92% 59% / 0.6)" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "reveal-up": "reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "progress-fill": "progress-fill 1.5s ease-out 0.8s forwards",
        float: "float 3s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        bounce: "bounce 1s ease-in-out infinite",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        soft: "var(--shadow-sm)",
        medium: "var(--shadow-md)",
        large: "var(--shadow-lg)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
