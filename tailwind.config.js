/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#22c55e",
        secondary: "#000000",
        surface: "#F8F9FA",
        error: "#FF3B30",
        success: "#34C759",
        black: "#000000",
        textSecondary: "#666666",
      },
      fontSize: {
        'xs': ['13px', '19px'],
        'sm': ['15px', '23px'],
        'base': ['17px', '27px'],
        'lg': ['20px', '31px'],
        'xl': ['22px', '31px'],
        '2xl': ['26px', '36px'],
        '3xl': ['32px', '42px'],
        '4xl': ['39px', '50px'],
      },
    },
  },
  plugins: [],
}
