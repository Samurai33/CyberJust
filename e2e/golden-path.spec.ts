import { test, expect } from "@playwright/test"

// Smoke coverage for the exact navigation gap #111/#112 fixed: the homepage
// used to have zero path to /episodes or /episodes/[id]. These specs exist
// so that regression is caught by CI, not by a future live-browser audit.

test("homepage loads and renders the primary navigation", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/CyberJustiça/)
  await expect(page.getByRole("link", { name: "EPISÓDIOS", exact: true })).toBeVisible()
})

test("homepage 'Ver Todos os Episódios' CTA navigates to /episodes", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /Ver Todos os Episódios/i }).first().click()
  await expect(page).toHaveURL(/\/episodes$/)
  await expect(page.getByRole("heading", { name: /EPISÓDIOS/i })).toBeVisible()
})

test("episode card navigates through to a real episode detail page", async ({ page }) => {
  await page.goto("/episodes")
  await page.getByRole("link", { name: /Detalhes/i }).first().click()
  await expect(page).toHaveURL(/\/episodes\/[^/]+$/)
  await expect(page.getByRole("link", { name: /Voltar aos Episódios/i })).toBeVisible()
})

test("nonexistent episode id renders the custom 404 page", async ({ page }) => {
  const response = await page.goto("/episodes/does-not-exist-12345")
  expect(response?.status()).toBe(404)
})
