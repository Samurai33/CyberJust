"use server"

import { cookies } from "next/headers"
import { randomBytes, createHmac, timingSafeEqual } from "crypto"

const SESSION_COOKIE = "cj_dashboard_session"
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

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
