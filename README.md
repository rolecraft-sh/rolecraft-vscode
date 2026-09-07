# RoleCraft - The Security-First Skill Manager for AI Agents

VS Code extension for [RoleCraft CLI](https://github.com/rolecraft-sh/rolecraft) — install, manage, and discover AI agent skills.

## Features

- **Skill Management** — Install, list, remove, and search skills from the sidebar
- **MCP Server Management** — Install, remove, and manage MCP servers from the sidebar
- **Profile Switcher** — Save and apply skill configurations
- **SKILL.md Support** — Syntax highlighting, autocomplete, and validation
- **Security Scanning** — View security reports before installing skills

## Requirements

- [RoleCraft CLI](https://github.com/rolecraft-sh/rolecraft) installed and available in PATH
- VS Code 1.85.0 or higher

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "RoleCraft"
4. Click Install

### From .vsix

1. Download the `.vsix` file from [Releases](https://github.com/rolecraft-sh/rolecraft-vscode/releases)
2. Open VS Code
3. Run `Extensions: Install from VSIX...` from the Command Palette
4. Select the downloaded `.vsix` file

## Usage

1. Open the RoleCraft sidebar (Activity Bar icon)
2. Browse installed skills in the Skills view
3. Use Command Palette (Ctrl+Shift+P) for all RoleCraft commands

## Commands

| Command                     | Description                             |
| --------------------------- | --------------------------------------- |
| `RoleCraft: Install Skill`  | Search and install skills from registry |
| `RoleCraft: Search Skills`  | Search available skills                 |
| `RoleCraft: List Skills`    | List installed skills                   |
| `RoleCraft: Remove Skill`   | Remove an installed skill               |
| `RoleCraft: Doctor`         | Run health check                        |
| `RoleCraft: Test Skill`     | Run skill tests                         |
| `RoleCraft: Init New Skill` | Create a new SKILL.md file              |
| `RoleCraft: Install MCP Server` | Search and install MCP servers       |
| `RoleCraft: Remove MCP Server`  | Remove an installed MCP server       |

## Configuration

| Setting                          | Default                     | Description                  |
| -------------------------------- | --------------------------- | ---------------------------- |
| `rolecraft.executablePath`       | `rolecraft`                 | Path to RoleCraft CLI        |
| `rolecraft.autoDetectAgents`     | `true`                      | Auto-detect installed agents |
| `rolecraft.defaultAgents`        | `["cursor", "claude-code"]` | Default agents               |
| `rolecraft.showStatusBar`        | `true`                      | Show status bar item         |
| `rolecraft.autoRefresh`          | `true`                      | Auto-refresh tree views      |
| `rolecraft.securityNotification` | `warning`                   | Security notification level  |

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint

# Test
npm test

# Package
npm run package
```

## License

MIT
