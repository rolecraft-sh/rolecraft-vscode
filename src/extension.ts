import * as vscode from 'vscode'
import { registerInstallCommand } from './commands/install.js'
import { registerSearchCommand } from './commands/search.js'
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

  const treeViews = [
    vscode.window.registerTreeDataProvider('rolecraft.skills', skillProvider),
    vscode.window.registerTreeDataProvider('rolecraft.mcp', mcpProvider),
    vscode.window.registerTreeDataProvider('rolecraft.profiles', profileProvider),
  ]

  registerInstallCommand(context)
  registerSearchCommand(context)

  const commands = [
    vscode.commands.registerCommand('rolecraft.list', () => {
      skillProvider?.refresh()
    }),
    vscode.commands.registerCommand('rolecraft.remove', () => {
      vscode.window.showInformationMessage('RoleCraft: Remove Skill - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.doctor', () => {
      vscode.window.showInformationMessage('RoleCraft: Doctor - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.test', () => {
      vscode.window.showInformationMessage('RoleCraft: Test Skill - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.init', () => {
      vscode.window.showInformationMessage('RoleCraft: Init New Skill - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.mcp.install', () => {
      vscode.window.showInformationMessage('RoleCraft: Install MCP Server - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.mcp.start', () => {
      vscode.window.showInformationMessage('RoleCraft: Start MCP Server - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.mcp.stop', () => {
      vscode.window.showInformationMessage('RoleCraft: Stop MCP Server - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.mcp.remove', () => {
      vscode.window.showInformationMessage('RoleCraft: Remove MCP Server - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.profile.save', () => {
      vscode.window.showInformationMessage('RoleCraft: Save Profile - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.profile.apply', () => {
      vscode.window.showInformationMessage('RoleCraft: Apply Profile - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.profile.delete', () => {
      vscode.window.showInformationMessage('RoleCraft: Delete Profile - Coming soon')
    }),
  ]

  context.subscriptions.push(statusBar, ...treeViews, ...commands)

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

  const config = getConfig()
  statusBar.start(config.showStatusBar)
}

export function deactivate(): void {
  skillProvider = undefined
  mcpProvider = undefined
  profileProvider = undefined
  statusBar = undefined
}
