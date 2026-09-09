import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'
import type { SecurityScanResult, Skill, SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { showDetailPanel } from '../utils/detailView.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'
import { getCachedScan, securityScanFromTest, setCachedScan } from '../utils/securityScan.js'
import type { TestResult } from '../utils/testResult.js'

interface SkillElement {
  slug: string
  skill: Skill
}

const statusIcons: Record<string, string> = {
  clean: 'check',
  low: 'warning',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

function securityIcon(result: SecurityScanResult | undefined): vscode.ThemeIcon {
  if (!result || result.issues.length === 0) {
    return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'))
  }

  const worst = result.issues.reduce((max, i) => {
    const rank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 }
    return (rank[i.severity] ?? 0) > max ? (rank[i.severity] ?? 0) : max
  }, 0)

  const severity = worst >= 3 ? 'critical' : worst >= 2 ? 'high' : worst >= 1 ? 'medium' : 'low'
  const icon = statusIcons[severity]
  const color =
    severity === 'critical'
      ? 'testing.iconFailed'
      : severity === 'high'
        ? 'testing.iconFailed'
        : 'testing.iconPassed'

  return new vscode.ThemeIcon(icon, new vscode.ThemeColor(color))
}

function securityTooltip(result: SecurityScanResult | undefined): string {
  if (!result) return 'Security: not scanned'
  if (result.issues.length === 0) return `Security: passed (score: ${result.score}/100)`
  return `Security: ${result.issues.length} issue(s) (score: ${result.score}/100)`
}

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private scanResults = new Map<string, SecurityScanResult>()

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  async loadScanResults(): Promise<void> {
    try {
      const result = await runRolecraftJson<SkillListResult>(['list'])
      const slugs = Object.keys(result.skills)

      await Promise.allSettled(
        slugs.map(async (slug) => {
          const cached = getCachedScan(slug)
          if (cached) {
            this.scanResults.set(slug, cached)
            return
          }

          try {
            const slugDir = slug.replace(/\//g, '-')
            const skillPath = path.join(os.homedir(), '.agents', 'skills', slugDir, 'SKILL.md')
            const testResult = await runRolecraftJson<TestResult>(['test', skillPath])
            const scan = securityScanFromTest(testResult)
            setCachedScan(slug, scan)
            this.scanResults.set(slug, scan)
          } catch {
            // scan failed, leave without result
          }
        }),
      )

      this._onDidChangeTreeData.fire(undefined)
    } catch {
      // list failed
    }
  }

  getTreeItem(element: SkillElement): vscode.TreeItem {
    const name = element.slug.split('/').pop() ?? element.slug
    const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None)
    item.description = element.skill.source
    item.contextValue = 'skillInstalled'

    const scan = this.scanResults.get(element.slug) ?? getCachedScan(element.slug)
    item.iconPath = securityIcon(scan)
    item.tooltip = securityTooltip(scan)

    item.command = {
      command: 'rolecraft.showSkillDetail',
      title: 'Show Skill Detail',
      arguments: [element],
    }

    return item
  }

  async getChildren(): Promise<SkillElement[]> {
    try {
      const result = await runRolecraftJson<SkillListResult>(['list'])
      return Object.entries(result.skills).map(([slug, skill]) => ({ slug, skill }))
    } catch (error) {
      if (error instanceof RoleCraftNotFoundError) {
        vscode.window.showErrorMessage(
          'RoleCraft CLI not found. Please install it or configure the executable path.',
        )
      }
      return []
    }
  }
}

export function registerShowSkillDetailCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'rolecraft.showSkillDetail',
    (element?: SkillElement) => {
      if (!element) return
      const name = element.slug.split('/').pop() ?? element.slug
      showDetailPanel('rolecraftSkillDetail', `Skill: ${name}`, [
        { label: 'Slug', value: element.slug },
        { label: 'Source', value: element.skill.source },
        { label: 'Source Type', value: element.skill.sourceType },
        { label: 'Scope', value: element.skill.scope },
        { label: 'Agents', value: element.skill.agents.join(', ') || '-' },
        { label: 'Installed At', value: element.skill.installedAt },
      ])
    },
  )
  context.subscriptions.push(disposable)
}
