import * as vscode from 'vscode'

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface DetailSection {
  label: string
  value: string
}

function renderSections(sections: DetailSection[]): string {
  return sections
    .map(
      (s) => `<div class="row">
      <div class="row-label">${esc(s.label)}</div>
      <div class="row-value">${esc(s.value)}</div>
    </div>`,
    )
    .join('')
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
  h2 { margin: 0 0 16px; }
  .row { display: flex; padding: 8px 0; border-bottom: 1px solid var(--vscode-input-border); }
  .row-label { width: 160px; flex-shrink: 0; opacity: 0.6; }
  .row-value { flex: 1; word-break: break-word; }
  .muted { opacity: 0.5; }
</style>
</head>
<body>
  <h2>${esc(title)}</h2>
  ${bodyHtml}
</body>
</html>`
}

export function showDetailPanel(
  viewType: string,
  title: string,
  sections: DetailSection[],
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {})
  panel.webview.html = wrapHtml(title, renderSections(sections))
  return panel
}

export function showMarkdownPanel(
  viewType: string,
  title: string,
  markdown: string,
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {})
  const escaped = esc(markdown)
  panel.webview.html = wrapHtml(
    title,
    `<pre style="background:var(--vscode-textBlockQuote-background);padding:16px;border-radius:4px;overflow:auto;white-space:pre-wrap">${escaped}</pre>`,
  )
  return panel
}
