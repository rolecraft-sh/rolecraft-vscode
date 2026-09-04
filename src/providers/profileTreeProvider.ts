import * as vscode from 'vscode'
import type { Profile } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

type ProfileTreeItemElement = { type: 'root' } | { type: 'profile'; profile: Profile }

export class ProfileTreeProvider implements vscode.TreeDataProvider<ProfileTreeItemElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProfileTreeItemElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: ProfileTreeItemElement): vscode.TreeItem {
    if (element.type === 'root') {
      const item = new vscode.TreeItem('Profiles', vscode.TreeItemCollapsibleState.Expanded)
      item.iconPath = new vscode.ThemeIcon('account')
      return item
    }

    const { profile } = element
    const label = profile.active ? `${profile.name} (active)` : profile.name
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None)
    item.description = `${profile.skillCount} skills, ${profile.agents.length} agents`
    item.contextValue = profile.active ? 'profileActive' : 'profileInactive'

    if (profile.active) {
      item.iconPath = new vscode.ThemeIcon('star-full')
    } else {
      item.iconPath = new vscode.ThemeIcon('star-empty')
    }

    return item
  }

  async getChildren(element?: ProfileTreeItemElement): Promise<ProfileTreeItemElement[]> {
    if (!element) {
      return [{ type: 'root' }]
    }

    if (element.type === 'root') {
      try {
        const profiles = await runRolecraftJson<Profile[]>(['profile', 'list'])
        return profiles.map((profile) => ({ type: 'profile' as const, profile }))
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
