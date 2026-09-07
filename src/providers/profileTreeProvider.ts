import * as vscode from 'vscode'
import { runRolecraft } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'
import { type ProfileSummary, parseProfileList } from '../utils/profile.js'

export class ProfileTreeProvider implements vscode.TreeDataProvider<ProfileSummary> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProfileSummary | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: ProfileSummary): vscode.TreeItem {
    const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None)
    item.description = `${element.agentCount} agent(s)`
    item.tooltip = [
      element.description ?? undefined,
      element.updatedAt ? `Updated: ${element.updatedAt}` : undefined,
    ]
      .filter((line): line is string => line !== undefined)
      .join('\n')
    item.contextValue = 'profileSaved'
    item.iconPath = new vscode.ThemeIcon('star-full')

    return item
  }

  async getChildren(): Promise<ProfileSummary[]> {
    try {
      const output = await runRolecraft(['profile', 'list'])
      return parseProfileList(output)
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
