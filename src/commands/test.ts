import * as vscode from 'vscode'
import type { SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { type TestResult, getTestResultHtml } from '../utils/testResult.js'

export type { TestResult } from '../utils/testResult.js'

export function registerTestCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'rolecraft.test',
    async (skillArg?: { slug: string }) => {
      let slug = skillArg?.slug

      if (!slug) {
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

        slug = await vscode.window.showQuickPick(slugs, {
          placeHolder: 'Select a skill to test...',
        })
      }

      if (!slug) return

      let testResult: TestResult

      try {
        testResult = await runRolecraftJson<TestResult>(['test', slug])
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const retry = await vscode.window.showErrorMessage(
          `Failed to test skill "${slug}": ${message}`,
          'Retry',
        )
        if (retry === 'Retry') {
          vscode.commands.executeCommand('rolecraft.test', { slug })
        }
        return
      }

      const panel = vscode.window.createWebviewPanel(
        'rolecraftTestResult',
        `Test Result: ${slug}`,
        vscode.ViewColumn.One,
        {},
      )

      panel.webview.html = getTestResultHtml(slug, testResult)
    },
  )

  context.subscriptions.push(disposable)
}
