import * as vscode from 'vscode'
import { runRolecraft } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

interface MCPServerElement {
  name: string
  status: string
  command: string
}

export class MCPTreeProvider implements vscode.TreeDataProvider<MCPServerElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MCPServerElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: MCPServerElement): vscode.TreeItem {
    const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None)
    item.description = element.command
    item.contextValue = element.status === 'running' ? 'mcpRunning' : 'mcpStopped'

    const icon = element.status === 'running' ? 'pass' : 'error'
    item.iconPath = new vscode.ThemeIcon(icon)

    return item
  }

  async getChildren(): Promise<MCPServerElement[]> {
    try {
      const output = await runRolecraft(['mcp', 'list'])
      const servers: MCPServerElement[] = []
      const lines = output.split('\n')

      for (const line of lines) {
        const match = line.match(/^\s+\S+\s+(\S+)\s+(.+)$/)
        if (match) {
          servers.push({
            name: match[1],
            status: 'stopped',
            command: match[2].trim(),
          })
        }
      }

      return servers
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
