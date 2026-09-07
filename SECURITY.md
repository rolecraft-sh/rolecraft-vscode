# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in rolecraft-vscode, please report it privately.

**Do not** disclose the issue publicly until it has been addressed.

To report a vulnerability, open a GitHub Security Advisory at:

https://github.com/rolecraft-sh/rolecraft-vscode/security/advisories/new

Or email the maintainer directly (see the committer history for contact).

You should receive a response within 48 hours. If you don't, please follow up.

## Scope

This security policy covers:

- The VS Code extension source code
- The automated release pipeline (GitHub Actions workflows)
- Communication with the RoleCraft CLI

## Supported Versions

Only the latest published version on the VS Code Marketplace receives security updates.

## Supply Chain

This extension has **zero runtime dependencies** — only VS Code API is used. Security recommendations:

- Always install from the official VS Code Marketplace
- Verify the publisher is `rolecraft-sh`
- Pin the version in your workspace settings
