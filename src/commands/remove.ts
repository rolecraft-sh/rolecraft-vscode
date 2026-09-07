import * as vscode from 'vscode'
import type { SkillListResult } from '../types.js'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'

export function registerRemoveCommand(
  context: vscode.ExtensionContext,
  onRefresh: () => void,
): void {
  const disposable = vscode.commands.registerCommand('rolecraft.remove', async () => {
    let slugs: string[] = []

    try {
      const result = await runRolecraftJson<SkillListResult>(['list'])
      slugs = Object.keys(result.skills)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to list skills: ${message}`)
      return
    }

    if (slugs.length === 0) {
      vscode.window.showInformationMessage('No skills installed.')
      return
    }

    const selected = await vscode.window.showQuickPick(slugs, {
      placeHolder: 'Select a skill to remove...',
    })

    if (!selected) return

    const confirm = await vscode.window.showWarningMessage(
      `Remove skill "${selected}"?`,
      { modal: true },
      'Remove',
    )

    if (confirm !== 'Remove') return

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Removing skill: ${selected}`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Running rolecraft remove...' })

        try {
          await runRolecraft(['remove', selected])
          vscode.window.showInformationMessage(`Skill "${selected}" removed successfully.`)
          onRefresh()
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          const retry = await vscode.window.showErrorMessage(
            `Failed to remove skill: ${message}`,
            'Retry',
          )
          if (retry === 'Retry') {
            vscode.commands.executeCommand('rolecraft.remove')
          }
        }
      },
    )
  })

  context.subscriptions.push(disposable)
}
