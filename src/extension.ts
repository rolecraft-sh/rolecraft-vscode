import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('RoleCraft extension is now active')

  // Register commands
  const commands = [
    vscode.commands.registerCommand('rolecraft.install', () => {
      vscode.window.showInformationMessage('RoleCraft: Install Skill - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.search', () => {
      vscode.window.showInformationMessage('RoleCraft: Search Skills - Coming soon')
    }),
    vscode.commands.registerCommand('rolecraft.list', () => {
      vscode.window.showInformationMessage('RoleCraft: List Skills - Coming soon')
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
  ]

  context.subscriptions.push(...commands)
}

export function deactivate() {}
