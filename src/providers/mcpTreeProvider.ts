import * as vscode from 'vscode'
import { runRolecraft } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'
import { type McpServerEntry, parseMcpList } from '../utils/mcp.js'

export class MCPTreeProvider implements vscode.TreeDataProvider<McpServerEntry> {
  private _onDidChangeTreeData = new vscode.EventEmitter<McpServerEntry | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: McpServerEntry): vscode.TreeItem {
    const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None)
    item.description = element.command
    item.tooltip = element.agent ? `${element.agent}: ${element.command}` : element.command
    item.contextValue = 'mcpServer'
    item.iconPath = new vscode.ThemeIcon('server-process')

    return item
  }

  async getChildren(): Promise<McpServerEntry[]> {
    try {
      const output = await runRolecraft(['mcp', 'list'])
      return parseMcpList(output)
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
