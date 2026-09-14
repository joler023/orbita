import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Typing through userEvent in jsdom is slow on a loaded machine; the default 5s makes
    // component tests fail for the machine's mood rather than for the code.
    testTimeout: 20_000,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "e2e", ".next"],
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:5091",
    },
  },
});
