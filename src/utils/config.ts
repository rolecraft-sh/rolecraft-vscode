import * as vscode from 'vscode'

export interface RoleCraftConfig {
  executablePath: string
  autoDetectAgents: boolean
  defaultAgents: string[]
  showStatusBar: boolean
  autoRefresh: boolean
  securityNotification: 'warning' | 'error' | 'off'
  registryUrl: string
}

export function getConfig(): RoleCraftConfig {
  const config = vscode.workspace.getConfiguration('rolecraft')

  return {
    executablePath: config.get<string>('executablePath', 'rolecraft'),
    autoDetectAgents: config.get<boolean>('autoDetectAgents', true),
    defaultAgents: config.get<string[]>('defaultAgents', ['cursor', 'claude-code']),
    showStatusBar: config.get<boolean>('showStatusBar', true),
    autoRefresh: config.get<boolean>('autoRefresh', true),
    securityNotification: config.get<'warning' | 'error' | 'off'>(
      'securityNotification',
      'warning',
    ),
    registryUrl: config.get<string>('registryUrl', 'https://registry.rolecraft.sh'),
  }
}

export function onConfigChange(callback: (config: RoleCraftConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('rolecraft')) {
      callback(getConfig())
    }
  })
}
