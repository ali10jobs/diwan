import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  reporter: "list",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "pnpm build && pnpm start -p 3000",
    url: "http://127.0.0.1:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
