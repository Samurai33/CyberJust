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

test("header is present on inner pages and its section links lead back to the homepage", async ({ page }) => {
  await page.goto("/episodes/7")
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "ESPECIALISTAS" }).click()
  await expect(page).toHaveURL(/\/#especialistas$/)
  await expect(page.locator("#especialistas")).toBeVisible()
})

test("Portuguese route aliases redirect to the canonical routes", async ({ page }) => {
  await page.goto("/episodios/7")
  await expect(page).toHaveURL(/\/episodes\/7$/)
})

test("episode audio is served from this origin with byte-range support", async ({ request }) => {
  const response = await request.get("/audio/bfraudes-digitais.m4a", { headers: { Range: "bytes=0-15" } })
  expect(response.status()).toBe(206)
  expect(response.headers()["content-type"]).toContain("audio/mp4")
})

// Only asserts the UI wiring: Playwright's bundled Chromium may lack the
// proprietary AAC decoder, so actual decoding is verified in a real browser.
test("clicking OUVIR opens the global player bar", async ({ page }) => {
  await page.goto("/episodes/7")
  await page.getByRole("button", { name: /OUVIR/ }).click()
  await expect(page.getByRole("region", { name: "Player de áudio" })).toBeVisible()
})
