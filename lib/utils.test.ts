import { describe, it, expect } from "vitest"
import {
  getStatusColor,
  getThreatColor,
  getSeverityColor,
  getAudioUrl,
  formatTime,
  formatDate,
  truncateText,
  calculateCompletionRate,
  calculateEngagementScore,
  sanitizeHtml,
} from "./utils"

describe("getStatusColor", () => {
  it("returns the configured color for a known status", () => {
    expect(getStatusColor("ATIVO")).not.toBe("bg-gray-500/20 text-gray-400 border-gray-500/50")
  })

  it("falls back to a neutral color for an unknown status", () => {
    // @ts-expect-error deliberately passing an invalid status
    expect(getStatusColor("NOT_A_REAL_STATUS")).toBe("bg-gray-500/20 text-gray-400 border-gray-500/50")
  })
})

describe("getThreatColor", () => {
  it("returns the configured color for a known threat level", () => {
    expect(getThreatColor("CRÍTICO")).not.toBe("bg-gray-500/20 text-gray-400 border-gray-500/50")
  })

  it("falls back to a neutral color for an unknown threat level", () => {
    // @ts-expect-error deliberately passing an invalid threat level
    expect(getThreatColor("NOT_A_REAL_THREAT")).toBe("bg-gray-500/20 text-gray-400 border-gray-500/50")
  })
})

describe("getSeverityColor", () => {
  it("falls back to bg-gray-500 for an unknown severity", () => {
    // @ts-expect-error deliberately passing an invalid severity
    expect(getSeverityColor("NOT_REAL")).toBe("bg-gray-500")
  })
})

describe("getAudioUrl", () => {
  it("returns null for an episode id with no mapped audio", () => {
    expect(getAudioUrl("no-such-episode-id")).toBeNull()
  })
})

describe("formatTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00")
    expect(formatTime(5)).toBe("0:05")
    expect(formatTime(65)).toBe("1:05")
    expect(formatTime(3725)).toBe("62:05")
  })
})

describe("formatDate", () => {
  it("formats a date string in pt-BR's DD/MM/YYYY order", () => {
    // Only asserting the format shape, not the exact day: `formatDate` parses
    // via `new Date(dateString)`, which reads a bare "YYYY-MM-DD" as UTC
    // midnight — in a timezone behind UTC that displays as the previous
    // local day, so pinning an exact date here would be timezone-flaky.
    expect(formatDate("2026-01-15")).toMatch(/^\d{2}\/\d{2}\/2026$/)
  })
})

describe("truncateText", () => {
  it("returns the text unchanged when under the limit", () => {
    expect(truncateText("short", 10)).toBe("short")
  })

  it("truncates and appends an ellipsis when over the limit", () => {
    expect(truncateText("this is a long string", 7)).toBe("this is...")
  })
})

describe("calculateCompletionRate", () => {
  it("computes a percentage of completions over views", () => {
    expect(calculateCompletionRate(100, 50)).toBe(50)
  })

  it("returns 0 when there are no views (avoids division by zero)", () => {
    expect(calculateCompletionRate(0, 0)).toBe(0)
  })
})

describe("calculateEngagementScore", () => {
  it("averages completion rate and normalized listen time", () => {
    // completionRate=100, averageListenTime=3600s (1hr) -> (100 + 100) / 2 = 100
    expect(calculateEngagementScore(100, 3600)).toBe(100)
  })
})

describe("sanitizeHtml", () => {
  it("escapes HTML tags instead of letting them through raw", () => {
    const result = sanitizeHtml("<script>alert('xss')</script>")
    expect(result).not.toContain("<script>")
  })
})
