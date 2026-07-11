"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Dashboard } from "@/components/dashboard/Dashboard"

/**
 * Client boundary between the public marketing site and the authenticated
 * dashboard. `children` (the marketing tree) is rendered server-side by
 * app/page.tsx and passed in — it stays server-rendered even though this
 * wrapper is a client component, since React only needs the *decision* of
 * which subtree to show to happen on the client.
 */
export function HomeGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Dashboard />
  }

  return <>{children}</>
}
