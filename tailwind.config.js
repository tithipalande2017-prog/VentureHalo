export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#12151D',
        ink: '#10131A',
        matte: '#111318',
        gold: '#D4AF37',
        graysoft: '#d8d5d0',
        graymuted: '#9f9a8f'
      },
      boxShadow: {
        glow: '0 30px 80px rgba(212, 175, 55, 0.12)',
        panel: '0 18px 55px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255,255,255,0.04)'
      },
      backdropBlur: {
        soft: '12px'
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
