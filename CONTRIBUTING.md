# Contributing to RoleCraft VS Code

Thanks for your interest in contributing! Here's how you can help.

## Quick Start

```bash
git clone https://github.com/rolecraft-sh/rolecraft-vscode.git
cd rolecraft-vscode
npm install
npm run compile
```

Open the project in VS Code and press `F5` to launch the Extension Development Host.

**Requirements:** Node.js >= 20, VS Code >= 1.85.0

## Development Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes following the code style

3. Run lint and tests:
   ```bash
   npm run lint
   npm test
   ```

4. Commit with conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

5. Push and open a PR

## Code Style

- Use ES modules (`import`/`export`, no `require`)
- Prefer built-in Node.js modules (`node:child_process`, `node:util`, `node:path`)
- Formatting enforced by Biome: 2-space indent, single quotes, no semicolons
- Target: VS Code `^1.85.0`, TypeScript strict mode, ES2022
- Zero production dependencies — VS Code API only

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

## Find Something to Work On

Start with issues labeled [`good first issue`](https://github.com/rolecraft-sh/rolecraft-vscode/labels/good%20first%20issue).

Don't see anything you like? Open a [feature request](https://github.com/rolecraft-sh/rolecraft-vscode/issues/new?template=feature_request.md).

## What NOT to Do

- Never commit directly to `main`
- Never push code that breaks tests
- Never add production dependencies
- Never skip linting before pushing
- Never use `require()` — ES modules only

## Need Help?

- Open an [Issue](https://github.com/rolecraft-sh/rolecraft-vscode/issues)
- Check the [README](README.md)

## Code of Conduct

Be respectful and constructive. Keep discussions focused on the code.
