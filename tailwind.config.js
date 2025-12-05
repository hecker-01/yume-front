/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Zen Kaku Gothic New", "Inter", "ui-sans-serif", "system-ui"],
        serif: ["Noto Serif JP", "serif"],
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        washi: "#f9f7f2",
        charcoal: "#1e1e1e",
        sumi: "#2d3436",
        "sumi-muted": "#636e72",
        torii: "#c0392b",
        "torii-hover": "#a93226",
        matcha: "#556b2f",
        gold: "#d4ac0d",
        "card-bg": "#ffffff",
        "border-subtle": "#e5e0d8",
      },
    },
  },
  plugins: [],
};
