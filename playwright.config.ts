import { defineConfig, devices } from "@playwright/test"

// Deliberately scoped small (#133): one browser, a handful of golden-path
// smoke tests - not a full cross-browser/visual-regression suite. The repo
// had zero browser-level test coverage before this; the goal here is a
// baseline that catches "the site doesn't load" / "core navigation is
// broken" regressions (exactly the class of bug #111/#112 fixed), not to
// replace manual verification for every UI change.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
