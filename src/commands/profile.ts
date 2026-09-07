import * as vscode from 'vscode'
import { runRolecraft } from '../utils/cli.js'
import { type ProfileSummary, parseProfileList } from '../utils/profile.js'

const VALID_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/
const SUCCESS_PATTERN = /✅/

export const ACTIVE_PROFILE_KEY = 'rolecraft.activeProfile'

export interface ProfileCommandCallbacks {
  onProfileChanged: () => void
  onAllChanged: () => void
  onActiveProfileChange: (name: string | undefined) => void
}

interface ProfileActionResult {
  ok: boolean
  message: string
}

async function listProfiles(): Promise<ProfileSummary[]> {
  const output = await runRolecraft(['profile', 'list'])
  return parseProfileList(output)
}

async function pickProfile(placeHolder: string): Promise<string | undefined> {
  let profiles: ProfileSummary[] = []
  try {
    profiles = await listProfiles()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(`Failed to list profiles: ${message}`)
    return undefined
  }

  if (profiles.length === 0) {
    vscode.window.showInformationMessage(
      'No profiles saved. Use "RoleCraft: Save Profile" to create one.',
    )
    return undefined
  }

  const items: vscode.QuickPickItem[] = profiles.map((profile) => ({
    label: profile.name,
    description: `${profile.agentCount} agent(s)`,
    detail: profile.updatedAt
      ? `Updated: ${profile.updatedAt}`
      : (profile.description ?? undefined),
  }))

  const selected = await vscode.window.showQuickPick(items, { placeHolder })
  return selected?.label
}

async function inputProfileName(): Promise<string | undefined> {
  const name = await vscode.window.showInputBox({
    prompt: 'Enter a name for the profile',
    placeHolder: 'e.g. frontend-dev',
    validateInput: (value) => {
      const trimmed = value.trim()
      if (!trimmed) return 'Profile name is required.'
      if (!VALID_NAME_PATTERN.test(trimmed)) {
        return 'Use only letters, digits, hyphens, underscores, or dots.'
      }
      return undefined
    },
  })

  return name?.trim()
}

async function runProfileAction(title: string, args: string[]): Promise<ProfileActionResult> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: `Running ${args.join(' ')}...` })
      try {
        const output = await runRolecraft(args)
        return {
          ok: SUCCESS_PATTERN.test(output),
          message: output,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { ok: false, message }
      }
    },
  )
}

function profileNameFromArg(arg: unknown): string | undefined {
  if (typeof arg === 'string') return arg
  if (arg && typeof arg === 'object' && 'name' in arg) {
    const name = (arg as { name?: unknown }).name
    if (typeof name === 'string') return name
  }
  return undefined
}

export function registerProfileCommands(
  context: vscode.ExtensionContext,
  callbacks: ProfileCommandCallbacks,
): void {
  const saveDisposable = vscode.commands.registerCommand('rolecraft.profile.save', async () => {
    const name = await inputProfileName()
    if (!name) return

    const result = await runProfileAction(`Saving profile: ${name}`, ['profile', 'save', name])

    if (result.ok) {
      vscode.window.showInformationMessage(`Profile "${name}" saved successfully.`)
      callbacks.onProfileChanged()
    } else {
      vscode.window.showErrorMessage(result.message || `Failed to save profile "${name}".`)
    }
  })

  const applyDisposable = vscode.commands.registerCommand('rolecraft.profile.apply', async () => {
    const name = await pickProfile('Select a profile to apply...')
    if (!name) return

    const result = await runProfileAction(`Applying profile: ${name}`, ['profile', 'apply', name])

    if (result.ok) {
      vscode.window.showInformationMessage(`Profile "${name}" applied successfully.`)
      await context.globalState.update(ACTIVE_PROFILE_KEY, name)
      callbacks.onActiveProfileChange(name)
      callbacks.onAllChanged()
    } else {
      const retry = await vscode.window.showErrorMessage(
        result.message || `Failed to apply profile "${name}".`,
        'Retry',
      )
      if (retry === 'Retry') {
        vscode.commands.executeCommand('rolecraft.profile.apply')
      }
    }
  })

  const deleteDisposable = vscode.commands.registerCommand(
    'rolecraft.profile.delete',
    async (arg?: unknown) => {
      let name = profileNameFromArg(arg)

      if (!name) {
        name = await pickProfile('Select a profile to delete...')
        if (!name) return
      }

      const confirm = await vscode.window.showWarningMessage(
        `Delete profile "${name}"?`,
        { modal: true },
        'Delete',
      )
      if (confirm !== 'Delete') return

      const result = await runProfileAction(`Deleting profile: ${name}`, [
        'profile',
        'delete',
        name,
      ])

      if (result.ok) {
        vscode.window.showInformationMessage(`Profile "${name}" deleted successfully.`)
        const activeProfile = context.globalState.get<string>(ACTIVE_PROFILE_KEY)
        if (activeProfile === name) {
          await context.globalState.update(ACTIVE_PROFILE_KEY, undefined)
          callbacks.onActiveProfileChange(undefined)
        }
        callbacks.onProfileChanged()
      } else {
        const retry = await vscode.window.showErrorMessage(
          result.message || `Failed to delete profile "${name}".`,
          'Retry',
        )
        if (retry === 'Retry') {
          vscode.commands.executeCommand('rolecraft.profile.delete', name)
        }
      }
    },
  )

  context.subscriptions.push(saveDisposable, applyDisposable, deleteDisposable)
}
