/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        oatmeal: "#F9F8F6",
        ink: "#2C2A29",
        muted: "#737373",
        olive: "#7A8B73",
        brown: "#8B5A2B"
      },
      maxWidth: {
        content: "900px"
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "\"Times New Roman\"", "serif"],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

