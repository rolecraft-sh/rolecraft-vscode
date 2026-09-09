# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Security report sidebar panel (`WebviewViewProvider`) with animated gauge chart, risk breakdown, and expandable issue list
- "Scan All Skills" button in security report panel to scan all installed skills at once
- Security report auto-populates after skill install and on "Test Skill" right-click
- Install flow shows security report with Approve/Reject/View Details buttons before proceeding
- Skill, MCP, and Profile tree items open detail webview panel on click
- Right-click context menu: Test Skill, Remove Skill, Remove MCP, Apply Profile, Delete Profile
- `src/utils/securityScan.ts` — transforms `rolecraft test` output into `SecurityScanResult`
- `src/utils/detailView.ts` — shared webview detail panel renderer
- esbuild.mjs — extension + webview bundle (replaces esbuild.js)

### Fixed
- Install skill now installs only the selected skill (was installing all 52 from monorepo)
- Tree view refreshes automatically after skill install
- Install notification properly closes after completion

### Changed
- Test Skill command renders result in both sidebar security report and editor webview panel
- Sidebar security report view requires `"type": "webview"` in package.json for `resolveWebviewView` to fire

## [0.2.0] - 2026-09-08

### Added
- Install MCP Server command with debounced GitHub/npm search and multi-agent selection
- Remove MCP Server command with confirmation dialog and tree view refresh
- MCP tree view title and context menu actions (install, remove)
- Shared MCP list/search output parsing utilities with unit tests
- Save Profile command with input validation
- Apply Profile command with profile picker and all-view refresh
- Delete Profile command with confirmation dialog
- Active profile shown in the status bar with quick switch actions
- Profiles tree view title and context menu actions (save, apply, delete)
- Shared profile list output parsing utility with unit tests
- SKILL.md syntax highlighting with TextMate grammar for YAML frontmatter
- SKILL.md autocomplete for frontmatter fields and values
- SKILL.md frontmatter validation with required field checks and format validation
- SKILL.md hover provider for field documentation
- Quick fix to convert invalid slugs to kebab-case
- `rolecraft.validation.enabled` setting to toggle SKILL.md validation

## [0.1.0] - 2026-09-07

### Added
- CLI wrapper with JSON parsing and error handling
- TypeScript type definitions for CLI data structures
- VS Code settings integration (executablePath, autoDetectAgents, defaultAgents, etc.)
- Tree data providers for Skills, MCP Servers, and Profiles views
- Status bar provider with quick pick menu
- Install Skill command with debounced search and multi-agent selection
- Search Skills command with async registry search and source badges
- List Skills command with actions (Open SKILL.md, Test, Remove)
- Remove Skill command with confirmation dialog
- Doctor command with detailed output channel report
- Test Skill command with webview result panel
- Init New Skill command with input validation
- CI/CD workflows and VS Code debugging config
- 28 unit tests
