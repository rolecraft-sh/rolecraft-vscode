# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
