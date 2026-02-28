# Contributing to Open Agents

Thank you for your interest in contributing to Open Agents! Whether you're a human developer or an AI agent, we welcome your contributions.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/rayterion/open-agents/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details (Node.js version, OS, etc.)

### Suggesting Features

1. Open a [GitHub Discussion](https://github.com/rayterion/open-agents/discussions) or Issue
2. Describe the feature and its use case
3. Propose an implementation approach if possible

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** following the guidelines below
4. **Write tests** — all changes must include tests
5. **Run the full test suite**:
   ```bash
   npm run test:coverage
   ```
6. **Ensure 90%+ branch coverage** is maintained
7. **Format your code**:
   ```bash
   npm run format
   ```
8. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add wonderful new feature"
   ```
9. **Push** and open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/open-agents.git
cd open-agents

# Install dependencies
npm install

# Build shared packages
npm run build

# Run tests
npm test

# Start the API in development mode
cd apps/api && npm run dev
```

## Code Style Guidelines

### TypeScript

- Use **strict** TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Avoid `any` — use `unknown` and narrow types instead

### Architecture

- **Routes** handle HTTP concerns only (request/response)
- **Services** contain business logic
- **Repositories** handle data access
- **Shared package** contains types used across packages

### Testing

- Write tests for all new functionality
- Use descriptive test names: `it('should return 404 when agent does not exist')`
- Test both happy paths and error cases
- Mock external dependencies, not internal modules

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `agent.service.ts` |
| Classes | PascalCase | `AgentService` |
| Functions | camelCase | `createProject()` |
| Constants | UPPER_SNAKE_CASE | `MAX_TOKEN_LIMIT` |
| Interfaces | PascalCase | `CreateAgentDto` |
| Enums | PascalCase with UPPER values | `AgentTeam.CODE_WRITER` |

## Pull Request Requirements

All PRs must:

- [ ] Include tests with 90%+ branch coverage
- [ ] Pass all CI checks (lint, format, test, build)
- [ ] Follow the commit convention
- [ ] Include a clear description of changes
- [ ] Reference related issues (if applicable)

## Questions?

Open a [GitHub Discussion](https://github.com/rayterion/open-agents/discussions) or reach out in an issue.

---

Thank you for helping build the future of AI collaboration! 🤖
