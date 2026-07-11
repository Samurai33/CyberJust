---
name: token-economy
description: Practices for working on CyberJust with minimal wasted tokens - fewer redundant commands, smaller reads, judicious use of subagents. Apply this by default on every task in this repo, not just when asked.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Token Economy

CyberJust sessions tend to involve large diffs (many components, a few big context files) and verbose CLI output (`pnpm build`, `git status`, `gh` commands). Default to the cheapest command/tool that answers the actual question.

## Reading code

- **Grep before Read.** If you need to know whether/where something exists (an import, a function definition, a pattern), `Grep` for it — don't `Read` the whole file to eyeball it.
- **Read with `offset`/`limit`** when you already know roughly where the relevant section is (e.g., from a prior grep's line number), instead of reading a 400+ line file top to bottom. Files like `components/dashboard/ProjectModal.tsx`, `components/ui/sidebar.tsx`, and `app/episodes/[id]/page.tsx` are large — never read them in full just to check one function.
- **Don't re-read a file you just edited.** `Edit`/`Write` fail loudly if the change didn't apply — the harness already tracks the resulting state. Re-reading to "confirm" wastes a full file's worth of tokens for no new information.
- **Don't re-run a command whose result you already have.** If `pnpm type-check` just passed and you haven't touched any `.ts`/`.tsx` file since, it will still pass — don't run it again as a ritual before every commit.

## Running commands

- **Batch git status/diff checks.** One `git status --short` at the start of a work session is enough context for several edits — don't call it after every single file change.
- **`pnpm type-check` is cheap, `pnpm build` is not.** Use `type-check` as the fast feedback loop while iterating; reserve a full `pnpm build` for the final check before committing/pushing, not after every change.
- **Prefer `gh api` with `--jq`/`-q` over piping full JSON through `cat`/`head`** when you only need a couple of fields (issue state, PR mergeability, etc.) — the filtered response is a fraction of the size.
- **Cap `gh issue list`/`gh pr list` output** with `--json` + specific fields instead of the full default table when scripting against it.

## Subagents (Agent tool)

- **Don't spawn an agent for something you can grep/read directly in 1-2 tool calls.** Each agent call re-derives context from zero — it's the most expensive way to answer a small question.
- **Reserve parallel agent fan-out for genuinely large, independent, parallelizable work** — e.g., auditing 5+ unrelated dimensions of the codebase, or fixing 7+ non-overlapping file clusters at once. A single well-scoped task (one bug, one component, one small refactor) doesn't need a subagent.
- **Batch related fixes into fewer, larger agent tasks** rather than one agent per tiny issue — an agent fixing 3-5 related GitHub issues in one file cluster is far cheaper than 3-5 separate agent calls that each pay the context-loading cost from scratch.

## Reporting back

- Keep progress narration to one sentence per meaningful step, not a play-by-play of every tool call.
- Summaries should state what changed and what's next — skip restating the full context the user already has from earlier in the conversation.
