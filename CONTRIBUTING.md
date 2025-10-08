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
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## 📋 Contribution Guidelines

### Prerequisites

- Node.js >= 22.15.0
- pnpm >= 10.12.4
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
   pnpm lint
   pnpm type-check
   pnpm build
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
test: add unit tests for dashboard components
chore: update dependencies
```

## 🎨 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components
- Use functional components with hooks
- Follow React best practices
- Use TypeScript interfaces for props
- Implement proper error boundaries

### CSS/Styling
- Use TailwindCSS utility classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Ensure accessibility standards (WCAG 2.1)

### File Structure
```
components/
├── ui/           # Reusable UI components
├── forms/        # Form-specific components
└── sections/     # Page section components

hooks/            # Custom React hooks
lib/              # Utility functions
types/            # TypeScript type definitions
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

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Join our Discord community
- Contact maintainers directly

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

Thank you for contributing to CyberJustice Brasil! 🚀