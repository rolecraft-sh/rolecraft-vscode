import * as vscode from 'vscode'
import { getHoverContent } from './skillHoverUtils.js'

export class SkillHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position)
    if (!range) return undefined

    const word = document.getText(range)
    const line = document.lineAt(position.line).text

    if (!this.isInFrontmatter(document, position)) {
      return undefined
    }

    let content: string | undefined

    if (line.startsWith(`${word}:`)) {
      content = getHoverContent(word, word, true)
    } else if (line.includes(':')) {
      const field = line.split(':')[0].trim()
      content = getHoverContent(field, word, false)
    }

    if (content) {
      return new vscode.Hover(new vscode.MarkdownString(content))
    }

    return undefined
  }

  private isInFrontmatter(document: vscode.TextDocument, position: vscode.Position): boolean {
    const firstLine = document.lineAt(0)
    if (!firstLine.text.startsWith('---')) {
      return false
    }

    for (let i = 1; i < document.lineCount; i++) {
      const line = document.lineAt(i)
      if (line.text.startsWith('---')) {
        return position.line > 0 && position.line < i
      }
    }
    return false
  }
  dispose(): void {
    // Placeholder disposal logic; implement if needed.
  }
}
