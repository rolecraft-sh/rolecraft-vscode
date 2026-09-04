import * as vscode from 'vscode'
import type { Skill, SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { RoleCraftNotFoundError } from '../utils/errors.js'

interface SkillElement {
  slug: string
  skill: Skill
}

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillElement | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: SkillElement): vscode.TreeItem {
    const name = element.slug.split('/').pop() ?? element.slug
    const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None)
    item.description = element.skill.source
    item.contextValue = 'skillInstalled'
    item.iconPath = new vscode.ThemeIcon('check')

    item.command = {
      command: 'rolecraft.test',
      title: 'Test Skill',
      arguments: [element.skill],
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
