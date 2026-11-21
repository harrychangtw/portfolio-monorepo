import type { Config } from "tailwindcss";
import sharedConfig from "@portfolio/config/tailwind";

const config: Config = {
  presets: [sharedConfig],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Balances only: green is owed money, red owes money.
        positive: "hsl(var(--positive))",
        negative: "hsl(var(--negative))",
      },
    },
  },
};

export default config;
