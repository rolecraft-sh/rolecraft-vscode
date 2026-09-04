import * as vscode from 'vscode'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'
import { getConfig, onConfigChange } from '../utils/config.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

interface SkillListResult {
  skills: Record<string, unknown>
  total: number
}

export class StatusBarProvider implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem
  private refreshTimer: ReturnType<typeof setInterval> | undefined
  private disposables: vscode.Disposable[] = []

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
    this.statusBarItem.command = 'rolecraft.statusBar.click'
    this.disposables.push(this.statusBarItem)

    this.disposables.push(
      vscode.commands.registerCommand('rolecraft.statusBar.click', () => this.showQuickPick()),
    )

    this.disposables.push(
      onConfigChange((config) => {
        if (config.showStatusBar) {
          this.start(true)
        } else {
          this.stop()
        }
      }),
    )
  }

  start(showStatusBar: boolean): void {
    if (!showStatusBar) {
      this.stop()
      return
    }

    this.update()
    this.refreshTimer = setInterval(() => this.update(), 30_000)
  }

  stop(): void {
    this.statusBarItem.hide()
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = undefined
    }
  }

  async update(): Promise<void> {
    const config = getConfig()

    if (!config.showStatusBar) {
      this.stop()
      return
    }

    try {
      const version = await runRolecraft(['--version'])
      const skillList = await runRolecraftJson<SkillListResult>(['list'])
      const skillCount = skillList.total ?? 0

      let mcpCount = 0
      try {
        const mcpOutput = await runRolecraft(['mcp', 'list'])
        const mcpMatch = mcpOutput.match(/\((\d+)\)/)
        if (mcpMatch) {
          mcpCount = Number.parseInt(mcpMatch[1], 10)
        }
      } catch {
        // MCP list might fail, that's ok
      }

      this.statusBarItem.text = `$(beaker) rolecraft v${version} | ${skillCount} skills | ${mcpCount} MCP`
      this.statusBarItem.tooltip = `RoleCraft v${version}\nSkills: ${skillCount}\nMCP Servers: ${mcpCount}`
      this.statusBarItem.show()
    } catch (error) {
      if (error instanceof RoleCraftNotFoundError) {
        this.statusBarItem.text = '$(beaker) rolecraft (CLI not found)'
        this.statusBarItem.tooltip = 'RoleCraft CLI not found. Install it or configure the path.'
      } else {
        this.statusBarItem.text = '$(beaker) rolecraft (error)'
        this.statusBarItem.tooltip = `RoleCraft error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      this.statusBarItem.show()
    }
  }

  private async showQuickPick(): Promise<void> {
    const items: vscode.QuickPickItem[] = [
      { label: '$(download) Install Skill', description: 'Install a new skill' },
      { label: '$(list) List Skills', description: 'List installed skills' },
      { label: '$(pulse) Run Doctor', description: 'Check system health' },
      { label: '$(gear) Open Settings', description: 'Open RoleCraft settings' },
      { label: '$(refresh) Refresh Status', description: 'Refresh status bar' },
    ]

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select an action',
    })

    if (!selected) return

    if (selected.label.includes('Install Skill')) {
      vscode.commands.executeCommand('rolecraft.install')
    } else if (selected.label.includes('List Skills')) {
      vscode.commands.executeCommand('rolecraft.list')
    } else if (selected.label.includes('Run Doctor')) {
      vscode.commands.executeCommand('rolecraft.doctor')
    } else if (selected.label.includes('Open Settings')) {
      vscode.commands.executeCommand('workbench.action.openSettings', 'rolecraft')
    } else if (selected.label.includes('Refresh Status')) {
      this.update()
    }
  }

  dispose(): void {
    this.stop()
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
  }
}
