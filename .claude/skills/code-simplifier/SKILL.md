---
name: code-simplifier
description: Review CyberJust TypeScript/React code for idiomatic simplification. Detects over-engineering, unnecessary state, verbose patterns. Applies TS/React idioms without changing behavior.
triggers:
  - "simplify"
  - "too verbose"
  - "over-engineered"
  - "refactor this"
  - "make this idiomatic"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
effort: low
tags: [typescript, react, nextjs, simplify, refactor, idioms]
---

# CyberJust Code Simplifier

Review and simplify TypeScript/React code in this repo (Next.js 15 App Router, TailwindCSS, shadcn/ui components) while respecting the project's constraints.

## Constraints (never simplify away)

- Client/server component boundaries — never merge a `"use client"` component into a server component just to cut a file
- Error boundaries and loading states required by the App Router file conventions (`error.tsx`, `loading.tsx`)
- Type narrowing on external/API data — don't replace explicit guards with `as` casts
- Accessibility attributes (`aria-*`, semantic HTML) — never strip these for brevity
- Existing `types/` contracts shared across components — don't inline a shared type just to shorten one file

## Simplification Patterns

### 1. Derive state instead of syncing it

```tsx
// ❌ Verbose — redundant state + effect to keep it in sync
const [filtered, setFiltered] = useState<Episode[]>([]);
useEffect(() => {
  setFiltered(episodes.filter((e) => e.category === category));
}, [episodes, category]);

// ✅ Simple — derive during render
const filtered = useMemo(
  () => episodes.filter((e) => e.category === category),
  [episodes, category]
);
```

### 2. Early returns over nested conditionals

```tsx
// ❌ Verbose
function Badge({ status }: { status: string }) {
  if (status) {
    if (status === "active") {
      return <span className="text-green-500">Active</span>;
    } else {
      return <span className="text-gray-500">Inactive</span>;
    }
  }
  return null;
}

// ✅ Simple
function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return status === "active"
    ? <span className="text-green-500">Active</span>
    : <span className="text-gray-500">Inactive</span>;
}
```

### 3. Optional chaining / nullish coalescing over manual guards

```tsx
// ❌ Verbose
const name = user && user.profile && user.profile.name ? user.profile.name : "Unknown";

// ✅ Simple
const name = user?.profile?.name ?? "Unknown";
```

### 4. Array methods over manual loops

```tsx
// ❌ Verbose
const ids: string[] = [];
for (let i = 0; i < episodes.length; i++) {
  if (episodes[i].published) {
    ids.push(episodes[i].id);
  }
}

// ✅ Simple
const ids = episodes.filter((e) => e.published).map((e) => e.id);
```

## When to Use

- Manual invocation before opening a PR
- After a feature is functionally done but reads verbose
- When a component has grown unnecessary local state or duplicated logic

## Detection Commands

```bash
# useEffect that just mirrors props/state into local state (often removable)
rg "useEffect\(\(\) => \{\s*set[A-Z]" --type ts --type tsx -A 2

# Manual for-loops that could be array methods
rg "for \(let i = 0" --type ts --type tsx

# any casts hiding a real type issue
rg "as any" --type ts --type tsx
```

Do not change behavior while simplifying — if a simplification changes what the component renders or how data flows, stop and flag it instead of applying it silently.
