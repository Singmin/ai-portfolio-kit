import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run start -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 60000, env: { OPENAI_API_KEY: '', SITE_URL: 'http://127.0.0.1:3100', AI_RATE_LIMIT_DIR: '.cache/e2e-qa' } },
});
