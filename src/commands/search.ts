import * as vscode from 'vscode'
import type { SkillListResult } from '../types.js'
import { runRolecraft, runRolecraftJson } from '../utils/cli.js'
import { getConfig } from '../utils/config.js'
import { parseSearchResults, type SearchResult } from '../utils/search.js'

interface SearchItem extends SearchResult {
  installed: boolean
  source: 'registry' | 'local'
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

async function getInstalledSlugs(): Promise<Set<string>> {
  try {
    const result = await runRolecraftJson<SkillListResult>(['list'])
    return new Set(Object.values(result.skills).map((s) => s.slug))
  } catch {
    return new Set()
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

function formatSourceBadge(slug: string): string {
  if (slug.startsWith('npm:')) return '📦 npm'
  if (slug.includes('/')) return '🔗 GitHub'
  return '📋 registry'
}

function resolveWebUrl(slug: string): string {
  if (slug.startsWith('npm:')) {
    const pkg = slug.replace(/^npm:/, '')
    return `https://www.npmjs.com/package/${pkg}`
  }
  if (slug.includes('/')) {
    return `https://github.com/${slug}`
  }
  const config = getConfig()
  return `${config.registryUrl}/skills/${slug}`
}

export function registerSearchCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('rolecraft.search', async () => {
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = 'Search skills by name, description, or slug...'
    quickPick.busy = false

    let allItems: SearchItem[] = []

    quickPick.onDidChangeValue(async (value) => {
      if (!value.trim()) {
        quickPick.items = []
        return
      }

      quickPick.busy = true
      debounceSearch(value.trim(), async (results) => {
        const installedSlugs = await getInstalledSlugs()

        allItems = results.map((r) => ({
          ...r,
          installed: installedSlugs.has(r.slug),
          source: 'registry' as const,
        }))

        quickPick.items = allItems.map((item) => ({
          label: `${item.installed ? '✓ ' : ''}${item.slug}`,
          description: `${item.version} • ⭐ ${item.stars} • 📦 ${item.installs} • ${formatSourceBadge(item.slug)}`,
          detail: item.description,
        }))

        quickPick.busy = false
      })
    })

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0]
      if (!selected) {
        const query = quickPick.value.trim()
        if (query) {
          allItems = [
            {
              slug: query,
              description: '',
              version: '',
              stars: 0,
              installs: 0,
              installed: false,
              source: 'registry',
            },
          ]
        } else {
          quickPick.hide()
          return
        }
      }

      const item =
        allItems.find((i) => i.slug === quickPick.selectedItems[0]?.label?.replace(/^✓ /, '')) ??
        allItems[0]
      quickPick.hide()

      if (!item) return

      const actions: vscode.MessageItem[] = []

      if (!item.installed) {
        actions.push({ title: 'Install', isCloseAffordance: false })
      }

      actions.push({ title: 'View on Web', isCloseAffordance: false })
      actions.push({ title: 'Cancel', isCloseAffordance: true })

      const action = await vscode.window.showInformationMessage(
        `${item.slug} — ${item.description || 'No description'}`,
        ...actions,
      )

      if (action?.title === 'Install') {
        vscode.commands.executeCommand('rolecraft.install')
      } else if (action?.title === 'View on Web') {
        const url = resolveWebUrl(item.slug)
        vscode.env.openExternal(vscode.Uri.parse(url))
      }
    })

    context.subscriptions.push(quickPick)
    quickPick.show()
  })

  context.subscriptions.push(disposable)
}
