import * as vscode from 'vscode'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'
import {
  type McpSearchItem,
  type McpServerEntry,
  mcpInstallSource,
  parseMcpList,
  parseMcpSearchResults,
} from '../utils/mcp.js'

type McpSearchMode = 'github' | 'npm'

interface AgentOption {
  flag: string
  name: string
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined
const searchCache = new Map<string, McpSearchItem[]>()

async function searchMcpServers(query: string, mode: McpSearchMode): Promise<McpSearchItem[]> {
  const cacheKey = `${mode}:${query}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  try {
    const args = ['mcp', 'search', query]
    if (mode === 'npm') args.push('--npm')
    const output = await runRolecraft(args)
    const items = parseMcpSearchResults(output, mode)
    searchCache.set(cacheKey, items)
    return items
  } catch {
    return []
  }
}

function debounceSearch(
  query: string,
  mode: McpSearchMode,
  callback: (items: McpSearchItem[]) => void,
): void {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    const items = await searchMcpServers(query, mode)
    callback(items)
  }, 300)
}

async function getMcpCapableAgents(): Promise<AgentOption[]> {
  try {
    const result = await runRolecraftJson<{
      agents: Array<{
        flag: string
        name: string
        mcpSupport?: { supported: boolean }
      }>
    }>(['agents'])
    const agents = result.agents
      .filter((agent) => agent.mcpSupport?.supported !== false)
      .slice(0, 30)
      .map((agent) => ({ flag: agent.flag, name: agent.name }))
    if (agents.length > 0) return agents
  } catch {
    // fall through to defaults
  }

  return [
    { flag: 'agents', name: 'opencode' },
    { flag: 'claude', name: 'claude-code' },
    { flag: 'cursor', name: 'cursor' },
  ]
}

function formatSearchItem(item: McpSearchItem): vscode.QuickPickItem {
  const summary =
    item.source === 'github'
      ? `${item.stars ?? 0} stars${item.language ? `, ${item.language}` : ''}`
      : `npm${item.keywords ? `, ${item.keywords}` : ''}`

  return {
    label: item.name,
    description: summary,
    detail: item.description || undefined,
  }
}

function toAgentFlags(agents: AgentOption[]): string[] {
  return agents.map((agent) => `--${agent.flag}`)
}

function serverNameFromArg(arg: unknown): string | undefined {
  if (typeof arg === 'string') return arg
  if (arg && typeof arg === 'object' && 'name' in arg) {
    const name = (arg as { name?: unknown }).name
    if (typeof name === 'string') return name
  }
  return undefined
}

async function listInstalledServers(): Promise<McpServerEntry[]> {
  const output = await runRolecraft(['mcp', 'list'])
  return parseMcpList(output)
}

function modeButtonFor(mode: McpSearchMode): vscode.QuickInputButton {
  return {
    iconPath: new vscode.ThemeIcon(mode === 'github' ? 'package' : 'github'),
    tooltip:
      mode === 'github'
        ? 'Search npm packages instead of GitHub'
        : 'Search GitHub repositories instead of npm',
  }
}

export function registerMCPCommands(context: vscode.ExtensionContext, onRefresh: () => void): void {
  const installDisposable = vscode.commands.registerCommand('rolecraft.mcp.install', async () => {
    let mode: McpSearchMode = 'github'
    let allResults: McpSearchItem[] = []

    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = 'Search MCP servers on GitHub'
    quickPick.busy = false

    const updateMode = (): void => {
      mode = mode === 'github' ? 'npm' : 'github'
      quickPick.placeholder =
        mode === 'github' ? 'Search MCP servers on GitHub' : 'Search MCP servers on npm'
      quickPick.buttons = [modeButtonFor(mode)]
    }

    quickPick.buttons = [modeButtonFor(mode)]

    const runSearch = (value: string): void => {
      const query = value.trim()
      if (!query) {
        allResults = []
        quickPick.items = []
        quickPick.busy = false
        return
      }

      quickPick.busy = true
      debounceSearch(query, mode, (items) => {
        allResults = items
        quickPick.items = items.map(formatSearchItem)
        quickPick.busy = false
        if (items.length === 0) {
          quickPick.placeholder = 'No results found. Try a different query or switch source.'
        }
      })
    }

    quickPick.onDidTriggerButton(() => {
      updateMode()
      runSearch(quickPick.value)
    })

    quickPick.onDidChangeValue((value) => {
      runSearch(value)
    })

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0]
      quickPick.hide()

      let source: string | undefined
      if (selected) {
        const item = allResults.find((result) => result.name === selected.label)
        if (item) source = mcpInstallSource(item)
      }
      if (!source) {
        const typed = quickPick.value.trim()
        if (typed) source = typed
      }
      if (!source) return

      const agents = await getMcpCapableAgents()
      const defaultAgents = vscode.workspace
        .getConfiguration('rolecraft')
        .get<string[]>('defaultAgents', [])

      const agentQuickPick = vscode.window.createQuickPick()
      agentQuickPick.placeholder = 'Select agents to install the MCP server for...'
      agentQuickPick.canSelectMany = true
      agentQuickPick.items = agents.map((agent) => ({
        label: agent.name,
        description: `--${agent.flag}`,
      }))
      agentQuickPick.selectedItems = agentQuickPick.items.filter((item) =>
        defaultAgents.includes(item.label),
      )

      agentQuickPick.onDidAccept(async () => {
        const selectedAgents = agentQuickPick.selectedItems
          .map((item) => agents.find((agent) => agent.name === item.label))
          .filter((agent): agent is AgentOption => agent !== undefined)

        agentQuickPick.hide()

        if (selectedAgents.length === 0) {
          vscode.window.showWarningMessage('Select at least one agent to install for.')
          return
        }

        const agentFlags = toAgentFlags(selectedAgents)
        const installSource = source

        try {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Installing MCP server: ${installSource}`,
              cancellable: false,
            },
            async (progress) => {
              progress.report({ message: 'Running rolecraft mcp install...' })
              await runRolecraft(['mcp', 'install', installSource, '--yes', ...agentFlags])
            },
          )

          vscode.window.showInformationMessage(
            `MCP server "${installSource}" installed successfully.`,
          )
          onRefresh()
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          const retry = await vscode.window.showErrorMessage(
            `Failed to install MCP server: ${message}`,
            'Retry',
          )
          if (retry === 'Retry') {
            vscode.commands.executeCommand('rolecraft.mcp.install')
          }
        }
      })

      context.subscriptions.push(agentQuickPick)
      agentQuickPick.show()
    })

    context.subscriptions.push(quickPick)
    quickPick.show()
  })

  const removeDisposable = vscode.commands.registerCommand(
    'rolecraft.mcp.remove',
    async (arg?: unknown) => {
      let name = serverNameFromArg(arg)

      if (!name) {
        let servers: McpServerEntry[] = []
        try {
          servers = await listInstalledServers()
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          vscode.window.showErrorMessage(`Failed to list MCP servers: ${message}`)
          return
        }

        if (servers.length === 0) {
          vscode.window.showInformationMessage('No MCP servers installed.')
          return
        }

        const picked = await vscode.window.showQuickPick(
          servers.map((server) => ({
            label: server.name,
            description: server.agent,
            detail: server.command,
          })),
          { placeHolder: 'Select an MCP server to remove...' },
        )
        if (!picked) return
        name = picked.label
      }

      const confirm = await vscode.window.showWarningMessage(
        `Remove MCP server "${name}" from all configured agents?`,
        { modal: true },
        'Remove',
      )
      if (confirm !== 'Remove') return

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Removing MCP server: ${name}`,
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Running rolecraft mcp remove...' })
            await runRolecraft(['mcp', 'remove', name])
          },
        )

        vscode.window.showInformationMessage(`MCP server "${name}" removed successfully.`)
        onRefresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const retry = await vscode.window.showErrorMessage(
          `Failed to remove MCP server "${name}": ${message}`,
          'Retry',
        )
        if (retry === 'Retry') {
          vscode.commands.executeCommand('rolecraft.mcp.remove', name)
        }
      }
    },
  )

  context.subscriptions.push(installDisposable, removeDisposable)
}
