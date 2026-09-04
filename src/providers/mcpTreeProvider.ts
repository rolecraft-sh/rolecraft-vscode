import * as vscode from 'vscode'
import type { MCPServer } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

type MCPTreeItemElement = { type: 'root' } | { type: 'server'; server: MCPServer }

export class MCPTreeProvider implements vscode.TreeDataProvider<MCPTreeItemElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MCPTreeItemElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: MCPTreeItemElement): vscode.TreeItem {
    if (element.type === 'root') {
      const item = new vscode.TreeItem('MCP Servers', vscode.TreeItemCollapsibleState.Expanded)
      item.iconPath = new vscode.ThemeIcon('server')
      return item
    }

    const { server } = element
    const item = new vscode.TreeItem(server.name, vscode.TreeItemCollapsibleState.None)
    item.description = server.status
    item.contextValue = server.status === 'running' ? 'mcpRunning' : 'mcpStopped'

    const icon = server.status === 'running' ? 'pass' : 'error'
    item.iconPath = new vscode.ThemeIcon(icon)

    return item
  }

  async getChildren(element?: MCPTreeItemElement): Promise<MCPTreeItemElement[]> {
    if (!element) {
      return [{ type: 'root' }]
    }

    if (element.type === 'root') {
      try {
        const servers = await runRolecraftJson<MCPServer[]>(['mcp', 'list'])
        return servers.map((server) => ({ type: 'server' as const, server }))
      } catch (error) {
        if (error instanceof RoleCraftNotFoundError) {
          vscode.window.showErrorMessage(
            'RoleCraft CLI not found. Please install it or configure the executable path.',
          )
        }
        return []
      }
    }

    return []
  }
}
