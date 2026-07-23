import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".claude"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**", "components/**", "contexts/**", "hooks/**", "lib/**", "services/**"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "components/ui/**", // shadcn/ui primitives - vendored, not app logic
      ],
    },
  },
})
