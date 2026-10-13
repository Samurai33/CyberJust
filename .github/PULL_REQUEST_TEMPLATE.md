<!--
  Thanks for contributing! Keep the title in Conventional Commits form,
  e.g. "fix: resolve audio player sync issue" (see CONTRIBUTING.md).
-->

## Summary

<!-- What does this PR do, and why? -->

## Related issue(s)

<!-- Link issues this PR addresses. Use "Closes #123" to auto-close on merge. -->
Closes #

## Type of change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ Feature (non-breaking change that adds functionality)
- [ ] ♻️ Refactor / tech-debt (no behavior change)
- [ ] ⚡ Performance
- [ ] ♿ Accessibility
- [ ] 📝 Documentation
- [ ] 🔧 Chore / tooling / dependencies

## How was this tested?

<!-- Describe how you verified the change. Screenshots/recordings welcome for UI changes. -->

## Checklist

- [ ] `pnpm test` passes
- [ ] `pnpm build` passes (`astro check` + build)
- [ ] e2e passes against the Docker image (`BASE_URL=http://127.0.0.1:18080 pnpm test:e2e`)
- [ ] I checked the change in a real browser, on a phone too for user-facing changes
- [ ] Docs updated if behavior changed

<!--
  CI runs vitest → astro check → build (required check `build`) and the
  Playwright e2e suite against the production image on every PR.
-->
