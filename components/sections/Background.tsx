"use client"

import { useEffect, useRef } from "react"

// Deterministic scatter (simple LCG) so server and client render identical
// markup - no hydration mismatch, no per-render reshuffle.
const particles = (() => {
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  return Array.from({ length: 25 }, () => ({
    left: `${rand() * 100}%`,
    top: `${rand() * 100}%`,
    animationDelay: `${rand() * 3}s`,
    animationDuration: `${2 + rand() * 3}s`,
  }))
})()

export function Background() {
  const gridRef = useRef<HTMLDivElement>(null)

  // Parallax grid: written straight to the DOM in a rAF instead of React
  // state, so mouse movement never re-renders anything.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (gridRef.current) {
          gridRef.current.style.transform = `translate(${e.clientX * 0.01}px, ${e.clientY * 0.01}px)`
        }
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-red-500/10" />
        <div
          ref={gridRef}
          className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] will-change-transform"
        />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        {particles.map((particle, i) => (
          <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={particle} />
        ))}
      </div>
    </div>
  )
}
