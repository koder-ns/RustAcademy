import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
      "__tests__/**/*.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
