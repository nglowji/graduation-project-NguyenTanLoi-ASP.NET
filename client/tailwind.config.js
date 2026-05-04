/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "oklch(60% 0.25 250)",
          foreground: "oklch(100% 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(70% 0.25 50)",
          foreground: "oklch(100% 0 0)",
        },
        surface: {
          light: "oklch(98% 0.01 250)",
          dark: "oklch(15% 0.02 250)",
        }
      },
      fontFamily: {
        heading: ['"Montserrat"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      borderRadius: {
        'xl': '12px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      }
    },
  },
  plugins: [],
}
