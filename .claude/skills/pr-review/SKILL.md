---
description: >
  Batch-review open PRs on Samurai33/CyberJust in order of increasing complexity (XS -> S -> M -> L).
  For each PR: checks state (conflicts, CI, existing reviews), reads the full diff, analyzes the
  code in context, presents a summary with link + size + recommendation. Waits for explicit
  confirmation before any merge. Args: "triage" to run a full triage before reviewing.
  "from:<num>" to resume from a specific PR number.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - AskUserQuestion
---

# /pr-review

Review open pull requests on this repo (`Samurai33/CyberJust`) systematically, smallest diff first, so trivial PRs don't wait behind large ones.

## Workflow

### 1. List and size open PRs

```bash
gh pr list --repo Samurai33/CyberJust --state open --json number,title,author,additions,deletions,mergeable,reviewDecision
```

Bucket by size (additions + deletions): XS < 20, S < 100, M < 400, L >= 400. Review in that order.

### 2. Per PR

```bash
gh pr view <num> --repo Samurai33/CyberJust
gh pr diff <num> --repo Samurai33/CyberJust
```

- If `mergeable == CONFLICTING`: post a comment noting the conflict, skip the code review, move on.
- Otherwise read the full diff in context (open the touched files if the diff alone isn't enough to judge correctness).
- Check for: correctness bugs, missing edge cases, XSS/secrets issues (see the `security-guardian` skill), unnecessary complexity (see `code-simplifier`), and whether it matches this repo's Next.js/TypeScript conventions.

### 3. Present a summary, then stop

For each PR present: link, size bucket, one-paragraph assessment, and a recommendation (approve / request changes / needs discussion). **Do not merge, approve, or request changes on GitHub without explicit user confirmation** — this skill's job is to produce the assessment, not to act on it unilaterally.

### 4. Only after explicit confirmation

```bash
gh pr review <num> --repo Samurai33/CyberJust --approve -b "..."
# or
gh pr review <num> --repo Samurai33/CyberJust --request-changes -b "..."
```

## Args

- (no arg): review all open PRs, smallest first
- `triage`: run a lighter first pass (title/description/size only, no full diff read) to decide review order before doing deep reviews
- `from:<num>`: skip PRs already reviewed in a prior session, resume from PR `<num>`
