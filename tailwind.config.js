/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e2e',
          surface: '#181825',
          panel: '#11111b',
          border: '#313244',
          active: '#45475a',
          hover: '#313244',
          text: '#cdd6f4',
          subtext: '#a6adc8',
          accent: '#89b4fa',
          cyan: '#89dceb',
          purple: '#cba6f7',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          red: '#f38ba8'
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'JetBrains Mono', 'Consolas', 'Menlo', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
