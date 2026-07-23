"use server"

import { cookies, headers } from "next/headers"
import { randomBytes, createHmac, timingSafeEqual } from "crypto"

const SESSION_COOKIE = "cj_dashboard_session"
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_ATTEMPTS = 5

// Best-effort, in-memory login limiter: resets on cold start and isn't
// shared across serverless instances/regions. Raises the bar over the old
// client-side-only "3 attempts" UX lockout without requiring an external
// store; swap for Vercel KV/Upstash if this ever needs to be watertight.
const loginAttemptsByIp = new Map<string, { count: number; windowStart: number }>()

async function isRateLimited(): Promise<boolean> {
  const headerList = await headers()
  // x-forwarded-for is a comma-separated hop chain where earlier entries can
  // be supplied by the client itself - Vercel appends the real connecting IP
  // as the LAST hop rather than replacing the header. Taking the first entry
  // let an attacker rotate a fake value per request and get a fresh rate-limit
  // bucket every time; the last entry is the one the platform actually verified.
  const forwardedFor = headerList.get("x-forwarded-for")
  const ip = forwardedFor?.split(",").pop()?.trim() || "unknown"

  const now = Date.now()
  const entry = loginAttemptsByIp.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    loginAttemptsByIp.set(ip, { count: 1, windowStart: now })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS
}

function getSessionSecret(): string | null {
  return process.env.DASHBOARD_SESSION_SECRET ?? null
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a)
  const bufB = new TextEncoder().encode(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function authenticateDashboard(code: string): Promise<{ success: boolean; error?: string }> {
  const password = process.env.DASHBOARD_PASSWORD
  const secret = getSessionSecret()

  if (!password || !secret) {
    // Fail closed: if the server isn't configured, nobody gets in.
    return { success: false, error: "Autenticação não configurada no servidor." }
  }

  if (await isRateLimited()) {
    return { success: false, error: "Muitas tentativas. Aguarde um minuto e tente novamente." }
  }

  if (!safeEqual(code, password)) {
    return { success: false, error: "Código de acesso inválido" }
  }

  const nonce = randomBytes(16).toString("hex")
  const token = `${nonce}.${sign(nonce, secret)}`

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  return { success: true }
}

export async function checkDashboardSession(): Promise<boolean> {
  const secret = getSessionSecret()
  if (!secret) return false

  const cookieStore = await cookies()
  const value = cookieStore.get(SESSION_COOKIE)?.value
  if (!value) return false

  const [nonce, signature] = value.split(".")
  if (!nonce || !signature) return false

  return safeEqual(signature, sign(nonce, secret))
}

export async function logoutDashboard(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
