import { describe, it, expect } from "vitest"
import {
  getStatusColor,
  getThreatColor,
  getSeverityColor,
  formatTime,
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

describe("formatTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00")
    expect(formatTime(5)).toBe("0:05")
    expect(formatTime(65)).toBe("1:05")
    expect(formatTime(3725)).toBe("62:05")
  })

  it("returns 0:00 for NaN/Infinity (duration before metadata loads)", () => {
    expect(formatTime(Number.NaN)).toBe("0:00")
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00")
  })
})
