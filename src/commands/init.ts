import * as vscode from 'vscode'
import { runRolecraft } from '../utils/cli.js'

export function registerInitCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('rolecraft.init', async () => {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the new skill',
      placeHolder: 'my-skill',
      validateInput: (value) => {
        if (!value.trim()) return 'Name is required'
        if (!/^[a-z0-9-]+$/.test(value.trim()))
          return 'Use lowercase letters, numbers, and hyphens only'
        return null
      },
    })

    if (!name) return

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Initializing skill: ${name}`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Running rolecraft init...' })

        try {
          await runRolecraft(['init', name.trim()])
          vscode.window.showInformationMessage(`Skill "${name}" initialized successfully.`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          vscode.window.showErrorMessage(`Failed to initialize skill: ${message}`)
        }
      },
    )
  })

  context.subscriptions.push(disposable)
}
