import * as vscode from 'vscode'
import { registerDoctorCommand } from './commands/doctor.js'
import { registerInitCommand } from './commands/init.js'
import { registerInstallCommand } from './commands/install.js'
import { registerListCommand } from './commands/list.js'
import { registerMCPCommands } from './commands/mcp.js'
import { ACTIVE_PROFILE_KEY, registerProfileCommands } from './commands/profile.js'
import { registerRemoveCommand } from './commands/remove.js'
import { registerSearchCommand } from './commands/search.js'
import { registerTestCommand } from './commands/test.js'
import { SkillCompletionProvider } from './language/skillCompletion.js'
import { MCPTreeProvider } from './providers/mcpTreeProvider.js'
import { ProfileTreeProvider } from './providers/profileTreeProvider.js'
import { SkillTreeProvider } from './providers/skillTreeProvider.js'
import { StatusBarProvider } from './providers/statusBarProvider.js'
import { runRolecraft } from './utils/cli.js'
import { getConfig, onConfigChange } from './utils/config.js'
import { RoleCraftNotFoundError } from './utils/errors.js'

let skillProvider: SkillTreeProvider | undefined
let mcpProvider: MCPTreeProvider | undefined
let profileProvider: ProfileTreeProvider | undefined
let statusBar: StatusBarProvider | undefined

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('RoleCraft extension is now active')

  skillProvider = new SkillTreeProvider()
  mcpProvider = new MCPTreeProvider()
  profileProvider = new ProfileTreeProvider()
  statusBar = new StatusBarProvider()

  registerInstallCommand(context)
  registerSearchCommand(context)
  registerListCommand(context)
  registerRemoveCommand(context, () => skillProvider?.refresh())
  registerDoctorCommand(context)
  registerTestCommand(context)
  registerInitCommand(context)

  registerMCPCommands(context, () => mcpProvider?.refresh())
  registerProfileCommands(context, {
    onProfileChanged: () => profileProvider?.refresh(),
    onAllChanged: () => {
      skillProvider?.refresh()
      mcpProvider?.refresh()
      profileProvider?.refresh()
    },
    onActiveProfileChange: (name) => statusBar?.setActiveProfile(name),
  })

  const config = getConfig()

  const completionProvider = new SkillCompletionProvider({
    agents: config.defaultAgents,
    mcpServers: [],
  })

  context.subscriptions.push(
    statusBar,
    completionProvider,
    vscode.window.registerTreeDataProvider('rolecraft.skills', skillProvider),
    vscode.window.registerTreeDataProvider('rolecraft.mcp', mcpProvider),
    vscode.window.registerTreeDataProvider('rolecraft.profiles', profileProvider),
  )

  context.subscriptions.push(completionProvider.register(context))

  onConfigChange((updatedConfig) => {
    completionProvider.updateOptions({
      agents: updatedConfig.defaultAgents,
      mcpServers: [],
    })
    if (updatedConfig.showStatusBar) {
      statusBar?.start(true)
    } else {
      statusBar?.stop()
    }
  })

  context.subscriptions.push(
    onConfigChange((config) => {
      if (config.showStatusBar) {
        statusBar?.start(true)
      } else {
        statusBar?.stop()
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      skillProvider?.refresh()
      mcpProvider?.refresh()
      profileProvider?.refresh()
    }),
  )

  try {
    await runRolecraft(['--version'])
  } catch (error) {
    if (error instanceof RoleCraftNotFoundError) {
      vscode.window.showWarningMessage(
        'RoleCraft CLI not found. Please install it or configure the executable path in settings.',
      )
    }
  }

  statusBar.setActiveProfile(context.globalState.get<string>(ACTIVE_PROFILE_KEY))
  statusBar.start(config.showStatusBar)
}

export function deactivate(): void {
  skillProvider = undefined
  mcpProvider = undefined
  profileProvider = undefined
  statusBar = undefined
}
