export interface TestResult {
  slug: string
  passed: boolean
  duration: string
  details: string
}

export function getTestResultHtml(slug: string, result: TestResult): string {
  const statusColor = result.passed ? '#4caf50' : '#f44336'
  const statusText = result.passed ? 'PASSED' : 'FAILED'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Result: ${slug}</title>
  <style>
    body { font-family: var(--vscode-font-family); padding: 20px; }
    .status { font-size: 24px; font-weight: bold; color: ${statusColor}; margin-bottom: 16px; }
    .meta { color: var(--vscode-descriptionForeground); margin-bottom: 16px; }
    pre { background: var(--vscode-textBlockQuote-background); padding: 16px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="status">${statusText}</div>
  <div class="meta">Skill: ${slug} • Duration: ${result.duration}</div>
  <h3>Details</h3>
  <pre>${escapeHtml(result.details)}</pre>
</body>
</html>`
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
