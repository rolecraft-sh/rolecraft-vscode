import * as vscode from 'vscode'
import { MCPTreeProvider } from './providers/mcpTreeProvider.js'
import { ProfileTreeProvider } from './providers/profileTreeProvider.js'
import { SkillTreeProvider } from './providers/skillTreeProvider.js'

export function activate(context: vscode.ExtensionContext) {
  console.log('RoleCraft extension is now active')

  const skillProvider = new SkillTreeProvider()
  const mcpProvider = new MCPTreeProvider()
  const profileProvider = new ProfileTreeProvider()

  const treeViews = [
    vscode.window.registerTreeDataProvider('rolecraft.skills', skillProvider),
    vscode.window.registerTreeDataProvider('rolecraft.mcp', mcpProvider),
    vscode.window.registerTreeDataProvider('rolecraft.profiles', profileProvider),
  ]

  const commands = [
    vscode.commands.registerCommand('rolecraft.install', () => {
      vscode.window.showInformationMessage('RoleCraft: Install Skill - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.search', () => {
      vscode.window.showInformationMessage('RoleCraft: Search Skills - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.list', () => {
      skillProvider.refresh()
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

  context.subscriptions.push(...treeViews, ...commands)
}

export function deactivate() {}
