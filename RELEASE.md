# Release Process

Only maintainers can create releases. This document describes the step-by-step process for cutting a new release.

## Prerequisites

- All issues in the milestone are closed
- All PRs are merged to `main`
- `npm run lint` passes with zero errors
- `npm test` passes with zero failures
- You have push access to the repository

## Release Steps

### 1. Update CHANGELOG.md

Edit `CHANGELOG.md` and move items from `[Unreleased]` to a new version section:

```markdown
## [Unreleased]

## [0.2.0] - 2026-09-15

### Added
- Feature A (#issue)
- Feature B (#issue)

### Fixed
- Bug fix C (#issue)

### Changed
- Improvement D (#issue)
```

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:
- **Added** — new features
- **Changed** — changes in existing functionality
- **Deprecated** — soon-to-be removed features
- **Removed** — now removed features
- **Fixed** — any bug fixes
- **Security** — vulnerability fixes

### 2. Commit Changelog

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for vX.Y.Z release"
```

### 3. Create Signed Tag

```bash
git tag -s vX.Y.Z -m "vX.Y.Z - Release Title

- Feature A
- Feature B
- Bug fix C"
```

> Always use `git tag -s` (signed tag) instead of `git tag`. Unsigned tags will not show a "Verified" badge on GitHub.

### 4. Push Changes

```bash
git push origin main --tags
```

### 5. Create GitHub Release

```bash
gh release create vX.Y.Z --title "vX.Y.Z - Release Title" --notes "## vX.Y.Z - Release Title

### Added
- Feature A

### Fixed
- Bug fix C

**Full Changelog:** https://github.com/rolecraft-sh/rolecraft-vscode/blob/main/CHANGELOG.md"
```

### 6. Verify

- [ ] Release appears on [GitHub Releases](https://github.com/rolecraft-sh/rolecraft-vscode/releases)
- [ ] Tag shows "Verified" badge
- [ ] CHANGELOG.md is updated on `main`

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) — breaking changes
- **MINOR** (0.X.0) — new features (backward compatible)
- **PATCH** (0.0.X) — bug fixes (backward compatible)

For v0.x.y releases (pre-1.0), use minor versions for significant features.

## CI/CD

GitHub Actions workflows handle:
- Building the extension (`npm run compile`)
- Running tests (`npm test`)
- Linting (`npm run lint`)
- Packaging (`vsce package`)

Marketplace publishing is handled manually when ready.

## Checklist Template

Copy this for each release:

```markdown
## Release vX.Y.Z Checklist

- [ ] All milestone issues closed
- [ ] All PRs merged
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] CHANGELOG.md updated
- [ ] Signed tag created
- [ ] Tag pushed to origin
- [ ] GitHub Release created
- [ ] Release verified
```
