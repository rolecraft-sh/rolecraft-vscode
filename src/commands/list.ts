import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'
import type { Skill, SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'

interface SkillItem {
  slug: string
  skill: Skill
}

export function registerListCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('rolecraft.list', async () => {
    let items: SkillItem[] = []

    try {
      const result = await runRolecraftJson<SkillListResult>(['list'])
      items = Object.entries(result.skills).map(([slug, skill]) => ({ slug, skill }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to list skills: ${message}`)
      return
    }

    if (items.length === 0) {
      vscode.window.showInformationMessage(
        'No skills installed. Use "RoleCraft: Search Skills" to find skills.',
      )
      return
    }

    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = 'Select a skill to manage...'
    quickPick.items = items.map((item) => ({
      label: item.slug,
      description: `${item.skill.source} • ${item.skill.agents.join(', ')}`,
      detail: `Installed: ${new Date(item.skill.installedAt).toLocaleDateString()}`,
    }))

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0]
      quickPick.hide()

      if (!selected) return

      const item = items.find((i) => i.slug === selected.label)
      if (!item) return

      const actions: vscode.MessageItem[] = [
        { title: 'Open SKILL.md', isCloseAffordance: false },
        { title: 'Test', isCloseAffordance: false },
        { title: 'Remove', isCloseAffordance: false },
        { title: 'Cancel', isCloseAffordance: true },
      ]

      const action = await vscode.window.showInformationMessage(
        `${item.slug} — ${item.skill.source}`,
        ...actions,
      )

      if (action?.title === 'Open SKILL.md') {
        const slugDir = item.slug.replace(/\//g, '-')
        const skillPath = path.join(os.homedir(), '.agents', 'skills', slugDir, 'SKILL.md')
        try {
          const skillUri = vscode.Uri.file(skillPath)
          await vscode.workspace.fs.stat(skillUri)
          const doc = await vscode.workspace.openTextDocument(skillUri)
          await vscode.window.showTextDocument(doc)
        } catch {
          vscode.window.showInformationMessage('SKILL.md not found at expected location.')
        }
      } else if (action?.title === 'Test') {
        vscode.commands.executeCommand('rolecraft.test')
      } else if (action?.title === 'Remove') {
        vscode.commands.executeCommand('rolecraft.remove')
      }
    })

    context.subscriptions.push(quickPick)
    quickPick.show()
  })

  context.subscriptions.push(disposable)
}
