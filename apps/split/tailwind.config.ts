import type { Config } from "tailwindcss";
import sharedConfig from "@portfolio/config/tailwind";

const config: Config = {
  presets: [sharedConfig],
  // lib/ too: pay-methods.ts holds per-type field widths (w-12, w-24).
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/*.ts"],
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
