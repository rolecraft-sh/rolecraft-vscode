# rolecraft-vscode — Development Guidelines

> VS Code extension for RoleCraft CLI — The Security-First Skill Manager for AI Agents

## ⚠️ STARTUP CHECKLIST (read before every task)

1. `git checkout main && git pull` — start from latest main
2. `git checkout -b feat/my-feature` or `fix/my-bug` — create branch
3. Do all work on the feature branch (never on main)
4. `npm run lint` — check syntax before pushing
5. `npm test` — run tests
6. Never leave changes that break tests
7. Write tests for new features
8. Update docs (README, CHANGELOG) when needed
9. `git add ... && git commit -m "type: short description"` — title only, no body
10. `git push -u origin <branch>` — push
11. `gh pr create` — open PR with short one-sentence body
12. Before merging, wait for all GitHub Actions checks to pass. Never merge while checks are running.

## Workflow

- Before starting any task, ensure you're on `main` with latest changes, then create a new branch
- Complete all work on the feature branch
- After completing the work, run `npm run lint` and `npm test`
- Never leave changes that break tests
- Write tests for new features
- Update documentation (README, CHANGELOG) when needed
- After tests pass, commit (title only, no body), push, and open PR (one-sentence body)
- Self-merge is allowed (solo developer)

## Supported Agents

This project supports multiple agents working together:

- **OpenCode** — Primary development agent
- **Claude Code** — Alternative agent
- **Oh My Pi (OMP)** — Alternative agent
- **FreeBuff** — Alternative agent
- **Pi** — Alternative agent
- **Codex** — Alternative agent

All agents must follow the same rules defined in this document.

## Interaction Rules

- **Chat vs dev mode:** Before writing any code, confirm whether the user wants development or just information
- **Commit messages:** Title only, no body. Use Conventional Commits format
- **Co-Authored-By:** Append `Co-authored-by:` to every commit with the agent name
- **PR body:** One-sentence summary
- **Branch strategy:** Always branch from latest main for any work that requires a commit
- **Branch naming:** `feat/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`

## Commit Convention

Format: `type(scope): description`

Types:

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance task
- `refactor:` — Code refactoring
- `docs:` — Documentation
- `test:` — Adding tests
- `ci:` — CI/CD changes
- `style:` — Code style (formatting, no logic change)

Examples:

```
feat: add skill tree provider
fix: resolve MCP server status display
chore: update devDependencies
docs: add installation instructions
```

## Code Style

- Use ES modules (`import`/`export`, no `require`)
- Prefer built-in Node.js modules (`node:child_process`, `node:util`, `node:path`)
- Formatting enforced by Biome: 2-space indent, single quotes, no semicolons
- Target: VS Code `^1.85.0`
- TypeScript strict mode enabled
- Target: ES2022

## Testing

- Framework: `node:test` (built-in, zero-dependency)
- Test command: `npm test`
- Tests must pass before pushing
- Write tests for all new features
- Test file location: `src/**/*.test.ts`

## Linting

- `npm run lint` runs `biome check` (semantic + format)
- Must be zero errors before pushing
- Run `npm run lint:fix` to auto-fix formatting
- CI fails on lint errors

## Dependencies

- Zero production dependencies (VS Code API only)
- DevDependencies allowed: Biome, TypeScript, esbuild, @vscode/vsce
- Never add runtime dependencies that ship to users

## Documentation

- `README.md` — Setup, features, usage
- `CHANGELOG.md` — Version history (keep updated)
- Code comments: Avoid unless complex logic requires explanation

## What NOT to Do

- ❌ Never commit directly to `main`
- ❌ Never push code that breaks tests
- ❌ Never add production dependencies without discussion
- ❌ Never skip linting before pushing
- ❌ Never merge PR while CI checks are running
- ❌ Never use `require()` — ES modules only
- ❌ Never add comments unless absolutely necessary
- ❌ Never hardcode values that should be configurable

## Issue Workflow

- Issues are in `rolecraft-sh/rolecraft-vscode` repo
- Each issue has acceptance criteria and implementation details
- Work on issues in order: Phase 1 → 2 → 3 → etc.
- Close issue with commit message referencing issue number: `feat: implement #5`
