/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        signal: "#0F766E",
        cargo: "#F59E0B",
        navy: "#0F2742",
        thxBlue: "#049DBF",
        thxTeal: "#03A6A6",
        thxGreen: "#0AA66D",
        thxLight: "#F5F8FA"
      }
    }
  },
  plugins: []
};
