---
description: Generate a comprehensive recap (PRs, issues, recent commits) of Samurai33/CyberJust for sharing with the team. Pass "7d", "30d" etc. to control the lookback window (default 7d).
allowed-tools: Bash Read Grep
---

# Repo Recap

Generate a structured Markdown recap of this repo's recent state: open PRs, open issues, recent commits, ready to paste into a status update.

## Preconditions

```bash
gh auth status
git -C . log -1
```

Confirm `gh` is authenticated and we're inside the repo before gathering data.

## Data Gathering

```bash
# Window (default 7 days, override via arg)
SINCE=$(date -d "-7 days" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)

gh pr list --repo Samurai33/CyberJust --state open --json number,title,author,createdAt
gh issue list --repo Samurai33/CyberJust --state open --json number,title,labels,createdAt
git log --since="$SINCE" --oneline
```

## Output Format

```markdown
# CyberJust Recap — <date range>

## Commits (<N> since <date>)
- <short summary of what changed, grouped by area: app/, components/, etc.>

## Open PRs (<N>)
- [#<num>](link) <title> — <author>, opened <date>

## Open Issues (<N>)
- [#<num>](link) <title> — <labels>

## Executive Summary
<2-3 sentences: what's the overall state, anything blocking, anything needing attention>
```

## Args

- (no arg): last 7 days
- `30d`, `14d`, etc.: override the lookback window
