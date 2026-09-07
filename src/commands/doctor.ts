import * as vscode from 'vscode'
import type { DoctorResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'

export function registerDoctorCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('rolecraft.doctor', async () => {
    let result: DoctorResult

    try {
      result = await runRolecraftJson<DoctorResult>(['doctor'])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to run doctor: ${message}`)
      return
    }

    const outputChannel = vscode.window.createOutputChannel('RoleCraft Doctor')
    outputChannel.clear()

    outputChannel.appendLine('=== RoleCraft Doctor Report ===')
    outputChannel.appendLine('')
    outputChannel.appendLine(`RoleCraft Version: ${result.version}`)
    outputChannel.appendLine(`Node.js Version: ${result.nodeVersion}`)
    outputChannel.appendLine('')

    outputChannel.appendLine('--- Agents ---')
    if (result.agents.length === 0) {
      outputChannel.appendLine('  No agents found.')
    } else {
      for (const agent of result.agents) {
        const status = agent.installed ? '✓' : '✗'
        const version = agent.version ? ` (${agent.version})` : ''
        outputChannel.appendLine(`  ${status} ${agent.name}${version}`)
      }
    }
    outputChannel.appendLine('')

    outputChannel.appendLine('--- Skills ---')
    if (result.skills.length === 0) {
      outputChannel.appendLine('  No skills installed.')
    } else {
      for (const skill of result.skills) {
        const status = skill.installed ? '✓' : '✗'
        outputChannel.appendLine(`  ${status} ${skill.name} v${skill.version}`)
      }
    }
    outputChannel.appendLine('')

    outputChannel.appendLine('--- Issues ---')
    if (result.issues.length === 0) {
      outputChannel.appendLine('  No issues found.')
    } else {
      for (const issue of result.issues) {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ'
        outputChannel.appendLine(`  ${icon} ${issue.message}`)
        if (issue.fix) {
          outputChannel.appendLine(`    Fix: ${issue.fix}`)
        }
      }
    }

    outputChannel.show(true)

    const issueCount = result.issues.length
    if (issueCount === 0) {
      vscode.window.showInformationMessage('Doctor: No issues found.')
    } else {
      vscode.window.showWarningMessage(
        `Doctor: ${issueCount} issue(s) found. Check output for details.`,
      )
    }
  })

  context.subscriptions.push(disposable)
}
