import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'
import { type SearchResult, parseSearchResults } from '../utils/search.js'

interface AgentInfo {
  flag: string
  name: string
  label: string
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined
const searchCache = new Map<string, SearchResult[]>()

async function searchRegistry(query: string): Promise<SearchResult[]> {
  const cached = searchCache.get(query)
  if (cached) return cached

  try {
    const output = await runRolecraft(['search', query, '--registry'])
    const results = parseSearchResults(output)
    searchCache.set(query, results)
    return results
  } catch {
    return []
  }
}

function debounceSearch(query: string, callback: (results: SearchResult[]) => void): void {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    const results = await searchRegistry(query)
    callback(results)
  }, 300)
}

async function getAvailableAgents(): Promise<AgentInfo[]> {
  try {
    const result = await runRolecraftJson<{ agents: AgentInfo[] }>(['agents', '--json'])
    return result.agents.slice(0, 20)
  } catch {
    return [
      { flag: 'opencode', name: 'opencode', label: 'opencode' },
      { flag: 'claude', name: 'claude-code', label: 'claude-code' },
      { flag: 'cursor', name: 'cursor', label: 'cursor' },
    ]
  }
}

export function registerInstallCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('rolecraft.install', async () => {
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = 'Search for skills to install...'
    quickPick.busy = false

    let allResults: SearchResult[] = []
    let selectedResults: SearchResult[] = []

    quickPick.onDidChangeValue(async (value) => {
      if (!value.trim()) {
        quickPick.items = []
        return
      }

      quickPick.busy = true
      debounceSearch(value.trim(), (results) => {
        allResults = results
        quickPick.items = results.map((r) => ({
          label: r.slug,
          description: `${r.version} • ⭐ ${r.stars} • 📦 ${r.installs}`,
          detail: r.description,
        }))
        quickPick.busy = false
      })
    })

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems
      if (selected.length === 0) {
        const query = quickPick.value.trim()
        if (query && !query.includes('/') && !query.startsWith('npm:')) {
          selectedResults = [
            {
              slug: query,
              description: '',
              version: '',
              stars: 0,
              installs: 0,
            },
          ]
        } else {
          selectedResults = [
            {
              slug: query,
              description: '',
              version: '',
              stars: 0,
              installs: 0,
            },
          ]
        }
      } else {
        selectedResults = selected
          .map((item) => allResults.find((r) => r.slug === item.label))
          .filter((r): r is SearchResult => r !== undefined)
      }

      quickPick.hide()

      const agents = await getAvailableAgents()
      const agentPicks = agents.map((a) => ({
        label: a.name,
        description: a.label,
        flag: a.flag,
        picked: a.name === 'opencode',
      }))

      const agentQuickPick = vscode.window.createQuickPick()
      agentQuickPick.placeholder = 'Select agents to install for...'
      agentQuickPick.items = agentPicks.map((p) => ({
        label: p.label,
        description: p.description,
      }))
      agentQuickPick.canSelectMany = true
      agentQuickPick.selectedItems = agentQuickPick.items.filter(
        (item) => item.label === 'opencode',
      )

      agentQuickPick.onDidAccept(async () => {
        const selectedAgents = agentQuickPick.selectedItems
          .map((item) => agentPicks.find((p) => p.label === item.label))
          .filter((p): p is (typeof agentPicks)[number] => p !== undefined)

        agentQuickPick.hide()

        if (selectedResults.length === 0) return

        const source = selectedResults[0].slug
        const agentFlags = selectedAgents.map((a) => `--${a.flag}`)

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Installing skill: ${source}`,
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Running rolecraft install...' })

            try {
              const args = ['install', source, '--yes', ...agentFlags]
              await runRolecraft(args)

              const action = await vscode.window.showInformationMessage(
                `Skill "${source}" installed successfully!`,
                'Open SKILL.md',
              )

              if (action === 'Open SKILL.md') {
                try {
                  const listResult = await runRolecraftJson<{
                    skills: Record<string, { slug: string }>
                  }>(['list'])
                  const installedSlug =
                    Object.values(listResult.skills).find(
                      (s) =>
                        s.slug === source ||
                        s.slug.endsWith(`/${source}`) ||
                        s.slug === source.replace(/\//g, '-'),
                    )?.slug ?? source

                  const slugDir = installedSlug.replace(/\//g, '-')
                  const skillPath = path.join(
                    os.homedir(),
                    '.agents',
                    'skills',
                    slugDir,
                    'SKILL.md',
                  )
                  const skillUri = vscode.Uri.file(skillPath)
                  await vscode.workspace.fs.stat(skillUri)
                  const doc = await vscode.workspace.openTextDocument(skillUri)
                  await vscode.window.showTextDocument(doc)
                } catch {
                  vscode.window.showInformationMessage('SKILL.md not found at expected location.')
                }
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              const retry = await vscode.window.showErrorMessage(
                `Failed to install skill: ${message}`,
                'Retry',
              )

              if (retry === 'Retry') {
                vscode.commands.executeCommand('rolecraft.install')
              }
            }
          },
        )
      })

      context.subscriptions.push(agentQuickPick)
      agentQuickPick.show()
    })

    context.subscriptions.push(quickPick)
    quickPick.show()
  })

  context.subscriptions.push(disposable)
}
