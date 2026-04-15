import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["vitest-scripts/**/*.test.ts"],
    globals: true,
    setupFiles: ["./vitest/setup.ts"],
    env: {
      DATABASE_URL: "mysql://test:test@localhost:3306/testdb",
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
