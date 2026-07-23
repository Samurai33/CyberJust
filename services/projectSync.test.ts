import { describe, it, expect } from "vitest"
import type { Episode } from "@/types"
import type { Project } from "@/types/project"
import { episodes as realEpisodes } from "@/data/episodes"
import { mergeEpisodeWithProject, syncProjectsWithEpisodes } from "./projectSync"

function episode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 4,
    title: "Episode Four",
    date: "01/01/2024",
    description: "desc",
    status: "ATIVO",
    threat: "BAIXO",
    audioUrl: null,
    ...overrides,
  }
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 4,
    title: "Episode Four (dashboard copy)",
    date: "01/01/2024",
    description: "desc",
    status: "ATIVO",
    threat: "BAIXO",
    audioUrl: undefined,
    tags: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("mergeEpisodeWithProject", () => {
  it("returns the episode unchanged when there is no matching project", () => {
    const ep = episode()
    expect(mergeEpisodeWithProject(ep, undefined)).toBe(ep)
  })

  it("regression (#105, #132): a stale project audioUrl cannot grant audio to an episode with a real audioUrl of null", () => {
    const ep = episode({ audioUrl: null })
    // Simulates exactly the reported bug: a pre-jsDelivr-migration localStorage
    // entry still carrying an old, now-broken audio path for an episode that
    // canonically has no audio at all.
    const staleProject = project({ audioUrl: "/audio/old-broken-path.mp3" })

    const merged = mergeEpisodeWithProject(ep, staleProject)

    expect(merged.audioUrl).toBeNull()
  })

  it("still lets a project provide/correct a working audioUrl when the episode itself has one", () => {
    const ep = episode({ audioUrl: "https://cdn.jsdelivr.net/gh/example/old.m4a" })
    const updatedProject = project({ audioUrl: "https://cdn.jsdelivr.net/gh/example/updated.m4a" })

    const merged = mergeEpisodeWithProject(ep, updatedProject)

    expect(merged.audioUrl).toBe("https://cdn.jsdelivr.net/gh/example/updated.m4a")
  })

  it("falls back to the episode's own audioUrl when the project doesn't set one", () => {
    const ep = episode({ audioUrl: "https://cdn.jsdelivr.net/gh/example/real.m4a" })
    const p = project({ audioUrl: undefined })

    const merged = mergeEpisodeWithProject(ep, p)

    expect(merged.audioUrl).toBe("https://cdn.jsdelivr.net/gh/example/real.m4a")
  })

  it("still merges other project fields (e.g. an edited title) normally", () => {
    const ep = episode({ title: "Original Title" })
    const p = project({ title: "Admin-Edited Title" })

    const merged = mergeEpisodeWithProject(ep, p)

    expect(merged.title).toBe("Admin-Edited Title")
  })
})

describe("syncProjectsWithEpisodes", () => {
  it("returns the same array reference-equal length when every real episode already has a project", () => {
    const projects = realEpisodes.map((e) => project({ id: e.id }))

    const synced = syncProjectsWithEpisodes(projects)

    expect(synced).toHaveLength(projects.length)
  })

  it("does NOT refresh an existing project's stale audioUrl (documents the known gap #132 relies on mergeEpisodeWithProject to guard against)", () => {
    const staleProject = project({ id: 4, audioUrl: "/audio/old-broken-path.mp3" })

    const synced = syncProjectsWithEpisodes([staleProject])
    const stillThere = synced.find((p) => String(p.id) === "4")

    expect(stillThere?.audioUrl).toBe("/audio/old-broken-path.mp3")
  })
})
