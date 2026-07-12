/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#ffffff',
        ink: '#1a1a1a',
        rule: '#999999',
        muted: '#6b6657',
        link: '#1a4e8a',
        visited: '#6a3d8f',
        accent: '#8a1a1a',
        success: '#2d5a2d',
        warning: '#8a5a1a',
        error: '#8a1a1a',
        panel: '#f0f0f0',
      },
      maxWidth: {
        prose: '680px',
        page: '960px',
      },
    },
  },
  plugins: [],
};
