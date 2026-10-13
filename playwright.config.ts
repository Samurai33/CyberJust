import { defineConfig, devices } from '@playwright/test';

// Os testes rodam contra a imagem Docker de produção (nginx + headers + CSP), não contra o `astro dev`:
//   docker build -t cyberjust . && docker run -d -p 127.0.0.1:18080:8080 cyberjust
//   BASE_URL=http://127.0.0.1:18080 pnpm test:e2e
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://127.0.0.1:18080',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
});
