# Contributing to CyberJustice Brasil

We love your input! We want to make contributing to CyberJustice Brasil as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests (there's a minimal Vitest setup — see `pnpm test`; test coverage is still sparse, adding to it is welcome)
3. If you've changed APIs, update the documentation
4. Run `pnpm test` and `pnpm build` (which runs `astro check`), then the e2e suite against the Docker image (see README). CI runs the same steps, and the `build` check is required by branch protection before merge
5. Issue that pull request!

## 📋 Contribution Guidelines

### Prerequisites

- Node.js >= 22.12.0
- pnpm 10 (`corepack enable` picks the version from `package.json`)
- Git >= 2.34.0

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CyberJust.git
cd CyberJust

# Add upstream remote
git remote add upstream https://github.com/Samurai33/CyberJust.git

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow our coding standards
   - Write meaningful commit messages
   - Add tests for new features

3. **Test your changes**
   ```bash
   pnpm type-check
   pnpm build
   pnpm test
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use our PR template
   - Provide clear description
   - Link relevant issues

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples:
```bash
feat: add user authentication system
fix: resolve audio player synchronization issue
docs: update API documentation
style: format code with prettier
refactor: extract audio processing logic
test: add unit tests for the player time helpers
chore: update dependencies
```

## 🎨 Coding Standards

### TypeScript
- `astro/tsconfigs/strictest` is on. Don't add `any`/`as` escape hatches to work around a real type error.
- `pnpm build` runs `astro check`, and CI enforces it.

### Astro, HTML and CSS
- Pages and components are `.astro` and render to static HTML. Client JS only where it's needed, as a small TypeScript module or custom element in `src/scripts/`.
- **No inline styles or scripts.** The CSP has no `'unsafe-inline'`. Styles go in `src/styles/global.css` (N3XUS design-system layers and tokens).
- Mobile-first, semantic HTML, WCAG 2.2 AA, touch targets of at least 44px. Respect `prefers-reduced-motion`.

### File Structure
```
src/content/episodios/   # one Markdown file per episode (schema: src/content.config.ts)
src/pages/               # routes
src/components/          # .astro components
src/scripts/             # client-side TypeScript (player, site behaviour)
src/lib/                 # pure helpers (unit tested)
src/styles/global.css    # design system
docker/                  # nginx config and security headers
e2e/                     # Playwright suite
```

## 🐛 Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Samurai33/CyberJust/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Provide clear use cases
3. Explain the expected behavior
4. Consider the project scope and goals

## 📚 Documentation

- Update README.md if needed
- Add inline code documentation
- Update API documentation
- Include examples for new features

## ⚖️ Code of Conduct

By participating, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🆘 Getting Help

- Check existing issues first
- Open an issue if your question isn't already answered

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

Thank you for contributing to CyberJustice Brasil! 🚀