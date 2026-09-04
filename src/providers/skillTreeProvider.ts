import * as vscode from 'vscode'
import type { Skill, SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

type SkillTreeItemElement = { type: 'root' } | { type: 'skill'; skill: Skill; slug: string }

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

    const { skill, slug } = element
    const name = slug.split('/').pop() ?? slug
    const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None)
    item.description = skill.source
    item.contextValue = 'skillInstalled'
    item.iconPath = new vscode.ThemeIcon('check')

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
        const result = await runRolecraftJson<SkillListResult>(['list'])
        return Object.entries(result.skills).map(([slug, skill]) => ({
          type: 'skill' as const,
          slug,
          skill,
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

    return []
  }
}
