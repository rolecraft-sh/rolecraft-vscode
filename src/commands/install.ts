import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'
import { type SearchResult, parseSearchResults } from '../utils/search.js'
import { securityScanFromTest } from '../utils/securityScan.js'
import type { TestResult } from '../utils/testResult.js'
import type { SecurityReportViewProvider } from '../webview/securityReport.js'

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

export function registerInstallCommand(
  context: vscode.ExtensionContext,
  onInstalled?: () => void,
  securityReportProvider?: SecurityReportViewProvider,
): void {
  const disposable = vscode.commands.registerCommand('rolecraft.install', async () => {
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = 'Search for skills to install...'
    quickPick.busy = false

    let allResults: SearchResult[] = []

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
      let fromSearch = false
      let slug = ''

      if (selected.length === 0) {
        const query = quickPick.value.trim()
        slug = query
      } else {
        const found = selected
          .map((item) => allResults.find((r) => r.slug === item.label))
          .filter((r): r is SearchResult => r !== undefined)
        fromSearch = found.length > 0
        slug = found[0]?.slug ?? quickPick.value.trim()
      }

      quickPick.hide()
      if (!slug) return

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

        const agentFlags = selectedAgents.map((a) => `--${a.flag}`)

        if (securityReportProvider) {
          try {
            const skillPath = path.join(
              os.homedir(),
              '.agents',
              'skills',
              slug.replace('/', '-'),
              'SKILL.md',
            )
            const testResult = await runRolecraftJson<TestResult>(['test', skillPath])
            const scan = securityScanFromTest(testResult)
            const approved = await securityReportProvider.showInstallActions(scan)
            if (!approved) {
              vscode.window.showInformationMessage('Install cancelled.')
              return
            }
          } catch {
            // skill not yet installed — no prior test data, proceed with install
          }
        }

        try {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Installing skill: ${slug}`,
              cancellable: false,
            },
            async (progress) => {
              progress.report({ message: 'Running rolecraft install...' })

              const args = fromSearch
                ? ['install', 'rolecraft-sh/skills', '--skill', slug, '--yes', ...agentFlags]
                : ['install', slug, '--yes', ...agentFlags]
              await runRolecraft(args)

              onInstalled?.()

              const action = await vscode.window.showInformationMessage(
                `Skill "${slug}" installed successfully!`,
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
                        s.slug === slug ||
                        s.slug.endsWith(`/${slug}`) ||
                        s.slug === slug.replace(/\//g, '-'),
                    )?.slug ?? slug

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
            },
          )
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
      })

      context.subscriptions.push(agentQuickPick)
      agentQuickPick.show()
    })

    context.subscriptions.push(quickPick)
    quickPick.show()
  })

  context.subscriptions.push(disposable)
}
