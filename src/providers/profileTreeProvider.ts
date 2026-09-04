import * as vscode from 'vscode'
import type { Profile } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

interface ProfileElement {
  name: string
  active: boolean
  agents: string[]
  skillCount: number
}

export class ProfileTreeProvider implements vscode.TreeDataProvider<ProfileElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProfileElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: ProfileElement): vscode.TreeItem {
    const label = element.active ? `${element.name} (active)` : element.name
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None)
    item.description = `${element.skillCount} skills, ${element.agents.length} agents`
    item.contextValue = element.active ? 'profileActive' : 'profileInactive'

    if (element.active) {
      item.iconPath = new vscode.ThemeIcon('star-full')
    } else {
      item.iconPath = new vscode.ThemeIcon('star-empty')
    }

    return item
  }

  async getChildren(): Promise<ProfileElement[]> {
    try {
      const result = await runRolecraftJson<Profile[]>(['profile', 'list'])
      return result.map((profile) => ({
        name: profile.name,
        active: profile.active,
        agents: profile.agents,
        skillCount: profile.skillCount,
      }))
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
