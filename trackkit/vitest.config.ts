import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["hooks/**", "lib/**"],
      exclude: ["lib/supabase.ts", "lib/db-context.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
