---
name: issue-triage
description: >
  Issue triage for Samurai33/CyberJust: audit open issues, categorize, detect duplicates,
  cross-reference PRs, assess risk, optionally post comments.
  Args: "all" for deep analysis of every issue, issue numbers to focus on (e.g. "12 15"),
  no arg = audit only, no comments posted.
allowed-tools:
  - Bash
  - Read
  - Grep
effort: medium
tags: [triage, issues, github, categorize, duplicates]
---

# Issue Triage

## When to Use

Run this when the open-issues list has grown enough that it's unclear what's duplicate, what's stale, or what's actually actionable.

## Workflow

### 1. Pull open issues

```bash
gh issue list --repo Samurai33/CyberJust --state open --json number,title,labels,createdAt,body,comments
```

### 2. Categorize each

- **Bug** — reproducible defect
- **Feature request** — new capability
- **Question/support** — not actionable as code work
- **Duplicate** — matches another open issue (link both)
- **Stale** — no activity, unclear if still relevant

### 3. Cross-reference PRs

```bash
gh pr list --repo Samurai33/CyberJust --state all --search "<issue keywords>"
```

Flag issues that already have an open or merged PR addressing them.

### 4. Risk assessment (for bugs)

Rate each bug issue: does it affect the audio player, dashboard, forms, or is it cosmetic? Prioritize anything touching data integrity or the auth modal over cosmetic/CSS issues.

### 5. Output

Present a table: `# | title | category | risk | recommendation (close as duplicate / needs repro / ready to fix / needs more info)`.

## Args

- (no arg): audit only, produce the table, post nothing
- `all`: deep-read every issue's full thread (not just the first post) before categorizing
- issue numbers (e.g. `"12 15"`): focus deep analysis on just those, audit the rest lightly

Never close or comment on an issue without the user confirming the action first.
