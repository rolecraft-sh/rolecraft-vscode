import * as vscode from 'vscode'
import type { Skill } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

type SkillTreeItemElement = { type: 'root' } | { type: 'skill'; skill: Skill }

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillTreeItemElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillTreeItemElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: SkillTreeItemElement): vscode.TreeItem {
    if (element.type === 'root') {
      const item = new vscode.TreeItem('Skills', vscode.TreeItemCollapsibleState.Expanded)
      item.iconPath = new vscode.ThemeIcon('extensions')
      return item
    }

    const { skill } = element
    const item = new vscode.TreeItem(
      `${skill.name} v${skill.version}`,
      vscode.TreeItemCollapsibleState.None,
    )
    item.description = skill.description
    item.contextValue = skill.installed ? 'skillInstalled' : 'skillAvailable'

    if (skill.installed) {
      item.iconPath = new vscode.ThemeIcon('check')
    }

    item.command = {
      command: 'rolecraft.test',
      title: 'Test Skill',
      arguments: [skill],
    }

    return item
  }

  async getChildren(element?: SkillTreeItemElement): Promise<SkillTreeItemElement[]> {
    if (!element) {
      return [{ type: 'root' }]
    }

    if (element.type === 'root') {
      try {
        const skills = await runRolecraftJson<Skill[]>(['list'])
        return skills.map((skill) => ({ type: 'skill' as const, skill }))
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
