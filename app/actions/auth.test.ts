import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// In-memory cookie jar standing in for Next's real cookie store, so we can
// exercise the full set -> read -> tamper -> delete cycle in one test file.
const cookieJar = new Map<string, string>()

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value)
    },
    delete: (name: string) => {
      cookieJar.delete(name)
    },
  }),
  headers: async () => ({
    get: (name: string) => (name === "x-forwarded-for" ? "203.0.113.1" : null),
  }),
}))

const ORIGINAL_ENV = { ...process.env }

describe("app/actions/auth", () => {
  beforeEach(() => {
    cookieJar.clear()
    vi.resetModules()
    process.env.DASHBOARD_PASSWORD = "correct-horse-battery-staple"
    process.env.DASHBOARD_SESSION_SECRET = "test-signing-secret"
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("fails closed when DASHBOARD_PASSWORD is not configured", async () => {
    delete process.env.DASHBOARD_PASSWORD
    const { authenticateDashboard } = await import("./auth")

    const result = await authenticateDashboard("anything")

    expect(result.success).toBe(false)
    expect(cookieJar.size).toBe(0)
  })

  it("fails closed when DASHBOARD_SESSION_SECRET is not configured", async () => {
    delete process.env.DASHBOARD_SESSION_SECRET
    const { authenticateDashboard } = await import("./auth")

    const result = await authenticateDashboard("correct-horse-battery-staple")

    expect(result.success).toBe(false)
  })

  it("rejects an incorrect password and sets no cookie", async () => {
    const { authenticateDashboard } = await import("./auth")

    const result = await authenticateDashboard("wrong-password")

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(cookieJar.size).toBe(0)
  })

  it("rate-limits repeated attempts from the same IP", async () => {
    const { authenticateDashboard } = await import("./auth")

    for (let i = 0; i < 5; i++) {
      const result = await authenticateDashboard("wrong-password")
      expect(result.error).toBe("Código de acesso inválido")
    }

    const limited = await authenticateDashboard("correct-horse-battery-staple")

    expect(limited.success).toBe(false)
    expect(limited.error).toMatch(/muitas tentativas/i)
    expect(cookieJar.size).toBe(0)
  })

  it("accepts the correct password and issues a session cookie", async () => {
    const { authenticateDashboard } = await import("./auth")

    const result = await authenticateDashboard("correct-horse-battery-staple")

    expect(result.success).toBe(true)
    expect(cookieJar.get("cj_dashboard_session")).toBeTruthy()
  })

  it("checkDashboardSession reflects a session established by authenticateDashboard", async () => {
    const { authenticateDashboard, checkDashboardSession } = await import("./auth")

    expect(await checkDashboardSession()).toBe(false)

    await authenticateDashboard("correct-horse-battery-staple")

    expect(await checkDashboardSession()).toBe(true)
  })

  it("checkDashboardSession rejects a tampered cookie value", async () => {
    const { authenticateDashboard, checkDashboardSession } = await import("./auth")

    await authenticateDashboard("correct-horse-battery-staple")
    const tampered = cookieJar.get("cj_dashboard_session")!.replace(/.$/, (c) => (c === "0" ? "1" : "0"))
    cookieJar.set("cj_dashboard_session", tampered)

    expect(await checkDashboardSession()).toBe(false)
  })

  it("checkDashboardSession rejects a cookie signed with a different secret", async () => {
    const { authenticateDashboard } = await import("./auth")
    await authenticateDashboard("correct-horse-battery-staple")

    // Simulate the secret rotating between requests.
    process.env.DASHBOARD_SESSION_SECRET = "a-different-secret"
    vi.resetModules()
    const { checkDashboardSession } = await import("./auth")

    expect(await checkDashboardSession()).toBe(false)
  })

  it("logoutDashboard removes the session cookie", async () => {
    const { authenticateDashboard, checkDashboardSession, logoutDashboard } = await import("./auth")

    await authenticateDashboard("correct-horse-battery-staple")
    expect(await checkDashboardSession()).toBe(true)

    await logoutDashboard()

    expect(await checkDashboardSession()).toBe(false)
    expect(cookieJar.has("cj_dashboard_session")).toBe(false)
  })
})
