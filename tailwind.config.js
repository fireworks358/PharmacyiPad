/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#005eb8',
          'dark-blue': '#003087',
          green: '#007f3b',
          red: '#d5281b',
          yellow: '#ffeb3b',
          black: '#212b32',
          grey: '#4c6272',
          border: '#d8dde0',
          background: '#f0f4f5',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'nhs-body': ['19px', '28px'],
        'nhs-body-mobile': ['16px', '24px'],
        'nhs-heading-xl': ['48px', '56px'],
        'nhs-heading-l': ['36px', '44px'],
        'nhs-heading-m': ['26px', '32px'],
        'nhs-heading-s': ['22px', '28px'],
        // Extra large sizes for iPad arm's length visibility
        'nhs-display': ['80px', '88px'],
        'nhs-display-location': ['56px', '64px'],
      },
      minHeight: {
        'touch': '44px',
      },
      screens: {
        'ipad': '768px',
        'ipad-pro': '1024px',
      },
    },
  },
  plugins: [],
}
