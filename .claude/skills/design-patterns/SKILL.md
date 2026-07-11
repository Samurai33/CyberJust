---
name: design-patterns
description: React/Next.js design patterns for CyberJust. Server/Client composition, compound components, form validation with react-hook-form + zod, data-fetching boundaries. Use when designing new components or refactoring existing ones.
triggers:
  - "design pattern"
  - "how to structure"
  - "best pattern for"
  - "refactor to pattern"
allowed-tools:
  - Read
  - Grep
  - Glob
effort: medium
tags: [react, nextjs, design-patterns, architecture, components]
---

# CyberJust React/Next.js Design Patterns

Patterns that apply to this repo's App Router + Radix/shadcn component architecture. Focused on this project's actual stack (Next.js 15, React 19, TailwindCSS, react-hook-form, zod), not generic textbook patterns.

## 1. Server component by default, client component at the leaf

Push `"use client"` as far down the tree as possible — a page or section should stay a server component; only the interactive leaf (a button, a form, a player) opts into client rendering.

```tsx
// app/episodes/[id]/page.tsx — server component, fetches data
export default async function EpisodePage({ params }: { params: { id: string } }) {
  const episode = await getEpisode(params.id);
  return (
    <div>
      <EpisodeHeader episode={episode} />
      <AudioPlayer src={episode.audioUrl} />  {/* client component */}
    </div>
  );
}
```

```tsx
// components/episode/AudioPlayer.tsx
"use client";
export function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  // ...
}
```

## 2. Compound components for composite UI (matches Radix idioms)

When a component has multiple related parts (card + header + content), follow the same compound pattern already used by the Radix/shadcn primitives in `components/ui/`, instead of one component with a dozen boolean props.

```tsx
// ❌ Prop explosion
<ExpertCard showAvatar showBio showContact compact />

// ✅ Compound, matches the codebase's existing shadcn conventions
<ExpertCard>
  <ExpertCard.Avatar />
  <ExpertCard.Bio />
  <ExpertCard.Contact />
</ExpertCard>
```

## 3. Form validation: react-hook-form + zod schema, not manual state

This repo already depends on `react-hook-form`, `@hookform/resolvers`, and `zod` — use them for any new form instead of hand-rolled `useState` + manual validation.

```tsx
const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

function ContactForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## 4. Data hooks own fetching + loading + error state together

Follow the existing `hooks/` convention: a `useX` hook returns `{ data, isLoading, error }` rather than components managing three separate `useState` calls per fetch.

```tsx
// hooks/use-episodes.ts
export function useEpisodes(category?: string) {
  const [state, setState] = useState<{ data: Episode[]; isLoading: boolean; error: string | null }>({
    data: [],
    isLoading: true,
    error: null,
  });
  // ...
  return state;
}
```

## 5. Context for cross-cutting concerns only

`contexts/` should hold things genuinely global (theme, auth session) — don't reach for context to pass props down two levels; use composition/children instead.

## When to Use

- Starting a new feature area (new section, new dashboard widget)
- A component's prop list is growing past ~5-6 props
- Deciding whether something needs client-side state at all

## Detection

```bash
# Client components that don't actually use client-only APIs (candidate to demote to server component)
rg -l '"use client"' components/ app/ | xargs grep -L "useState\|useEffect\|useRef\|onClick\|onChange"

# Manual form state that should probably be react-hook-form
rg "useState.*errors|useState.*isValid" --type tsx
```
