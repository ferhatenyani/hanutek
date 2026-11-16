import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 3,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: ".qwen/tmp/playwright-report" }]],

  use: {
    baseURL: BASE,
    // Fail fast with a real actionability log instead of burning the whole
    // test timeout on a click that can never land.
    actionTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // Every page of this app is exercised through the same production build.
    launchOptions: { args: ["--disable-dev-shm-usage"] },
  },

  projects: [
    {
      name: "mobile",
      // Pixel 7 keeps the suite on Chromium, the only browser downloaded here.
      use: { ...devices["Pixel 7"], viewport: { width: 393, height: 851 } },
      testIgnore: /breakpoints\.spec\.ts/,
    },
    {
      name: "small-phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 640 } },
      testIgnore: /breakpoints\.spec\.ts/,
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /breakpoints\.spec\.ts/,
    },
    {
      // The custom-breakpoint matrix sets its own viewport per test.
      name: "breakpoints",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /breakpoints\.spec\.ts/,
    },
  ],

  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `${BASE}/fr`,
    // Always own the server: reusing a process started before a rebuild makes
    // it serve chunks that the new build has already replaced.
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
