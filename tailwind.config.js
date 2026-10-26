/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./admin/index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OSE deep navy — hero, footer, primary text
        ink: { DEFAULT: "#0E2233", 950: "#07131D", 900: "#0E2233", 800: "#153247", 700: "#1F4561", 600: "#2C5C7D" },
        // OSE vermilion — single accent, used sparingly
        signal: { DEFAULT: "#E8613A", 600: "#CC4B25", 100: "#FCE8E1" },
        // OSE teal — data, focus, live states
        sonar: { DEFAULT: "#1FA59A", 300: "#79D5CB", 100: "#DCF2EF" },
        paper: "#F5F6F4",
        line: "#DEE3E6",
        mute: "#5A6B77",
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      maxWidth: { page: "76rem" },
      boxShadow: {
        card: "0 1px 0 rgba(14,34,51,.04), 0 1px 3px rgba(14,34,51,.06)",
        lift: "0 10px 30px -12px rgba(14,34,51,.25)",
      },
      keyframes: {
        sweep: { "0%": { strokeDashoffset: "0" }, "100%": { strokeDashoffset: "-200" } },
        blink: { "0%,100%": { opacity: ".25" }, "50%": { opacity: "1" } },
      },
      animation: {
        sweep: "sweep 9s linear infinite",
        blink: "blink 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
