# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
