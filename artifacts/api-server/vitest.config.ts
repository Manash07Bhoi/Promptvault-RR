import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      JWT_SECRET: "test-jwt-secret-min-32-chars-for-testing!!",
      JWT_REFRESH_SECRET: "test-refresh-secret-min-32-chars-for-test!!",
    },
    include: ["src/tests/**/*.test.ts"],
    testTimeout: 30000, // Integration tests may be slower
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/tests/**"],
    },
  },
});
