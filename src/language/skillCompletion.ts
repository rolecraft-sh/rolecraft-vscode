import * as vscode from 'vscode'

export const FRONTMATTER_FIELD_NAMES = [
  'name',
  'slug',
  'owner',
  'description',
  'category',
  'mcp_servers',
  'agents',
  'version',
] as const

export const CATEGORY_OPTIONS = [
  'automation',
  'developer-tools',
  'devops',
  'documentation',
  'testing',
  'security',
  'data-processing',
  'code-generation',
  'analysis',
] as const

export interface SkillCompletionItemProviderOptions {
  agents: string[]
  mcpServers: string[]
}

export class SkillCompletionProvider implements vscode.CompletionItemProvider {
  private mcpServers: string[] = []
  private agents: string[] = []

  constructor(options: SkillCompletionItemProviderOptions = { agents: [], mcpServers: [] }) {
    this.agents = options.agents
    this.mcpServers = options.mcpServers
  }

  updateOptions(options: SkillCompletionItemProviderOptions): void {
    this.agents = options.agents
    this.mcpServers = options.mcpServers
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const frontmatterRange = this.getFrontmatterRange(document)
    if (!frontmatterRange) {
      return []
    }
    if (!this.isInFrontmatter(frontmatterRange, position)) {
      return []
    }

    const items: vscode.CompletionItem[] = []
    const line = document.lineAt(position.line)
    const textUntilCursor = line.text.slice(0, position.character)
    const match = textUntilCursor.match(/^\s*(\w*)\s*:\s*(.*)$/)
    if (match) {
      const key = match[1]
      const value = match[2]

      if (value === '' || value.endsWith(' ')) {
        if (key === 'category') {
          for (const cat of CATEGORY_OPTIONS) {
            items.push(this.createValueItem(cat, vscode.CompletionItemKind.Value, position))
          }
        } else if (key === 'agents') {
          for (const agent of this.agents) {
            items.push(this.createValueItem(agent, vscode.CompletionItemKind.Value, position))
          }
        } else if (key === 'mcp_servers') {
          for (const server of this.mcpServers) {
            items.push(this.createValueItem(server, vscode.CompletionItemKind.Value, position))
          }
        } else if (key === 'version') {
          items.push(this.createValueItem('1.0.0', vscode.CompletionItemKind.Value, position))
        }
      }

      if (
        key !== '' &&
        !FRONTMATTER_FIELD_NAMES.includes(key as (typeof FRONTMATTER_FIELD_NAMES)[number])
      ) {
        for (const field of FRONTMATTER_FIELD_NAMES) {
          if (FRONTMATTER_FIELD_NAMES.join('\n').includes(field)) {
            const fieldItem = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field)
            fieldItem.detail = 'SKILL.md frontmatter field'
            fieldItem.insertText = new vscode.SnippetString(`${field}$1`)
            fieldItem.range = new vscode.Range(position, position)
            items.push(fieldItem)
          }
        }
      }

      if (
        key !== '' &&
        FRONTMATTER_FIELD_NAMES.includes(key as (typeof FRONTMATTER_FIELD_NAMES)[number])
      ) {
        items.push(
          new vscode.CompletionItem('skill name', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill slug', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill owner', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill description', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill category', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill mcp_servers', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill agents', vscode.CompletionItemKind.Snippet),
          new vscode.CompletionItem('skill version', vscode.CompletionItemKind.Snippet),
        )
      }
    }

    return items
  }

  private getFrontmatterRange(document: vscode.TextDocument): vscode.Range | undefined {
    const firstLine = document.lineAt(0)
    if (!firstLine.text.startsWith('---')) {
      return undefined
    }

    for (let i = 1; i < document.lineCount; i++) {
      const line = document.lineAt(i)
      if (line.text.startsWith('---')) {
        return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(i, line.text.length))
      }
    }

    return undefined
  }

  private isInFrontmatter(range: vscode.Range, position: vscode.Position): boolean {
    return position.isAfterOrEqual(range.start) && position.isBeforeOrEqual(range.end)
  }

  private createValueItem(
    value: string,
    kind: vscode.CompletionItemKind,
    position: vscode.Position,
  ): vscode.CompletionItem {
    const item = new vscode.CompletionItem(value, kind)
    item.insertText = value
    item.range = new vscode.Range(position, position)
    return item
  }

  register(_context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider('skill', this, ':', ' ')
  }

  dispose(): void {
    // No-op - disposables are managed by VS Code
  }
}
