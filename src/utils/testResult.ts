export interface TestAssertion {
  name: string
  pass: boolean | null
  detail: string
  weight: number
}

export interface TestResult {
  skill: string
  score: number
  grade: string
  label: string
  assertions: TestAssertion[]
  suggestions: string[]
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#4caf50'
  if (score >= 70) return '#8bc34a'
  if (score >= 50) return '#ff9800'
  if (score >= 30) return '#ff5722'
  return '#f44336'
}

export function getTestResultHtml(slug: string, result: TestResult): string {
  const scoreColor = getScoreColor(result.score)

  const passed = result.assertions.filter((a) => a.pass === true)
  const failed = result.assertions.filter((a) => a.pass === false)
  const skipped = result.assertions.filter((a) => a.pass === null)

  let assertionsHtml = ''
  for (const a of result.assertions) {
    const icon = a.pass === true ? '✅' : a.pass === false ? '❌' : '⏭️'
    const color = a.pass === true ? '#4caf50' : a.pass === false ? '#f44336' : '#9e9e9e'
    assertionsHtml += `<div style="padding:4px 0;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--vscode-input-border)">
      <span>${icon}</span>
      <span style="flex:1;color:${color}">${escapeHtml(a.detail)}</span>
      <span style="opacity:0.5;font-size:12px">${a.weight}pts</span>
    </div>`
  }

  let suggestionsHtml = ''
  if (result.suggestions.length > 0) {
    suggestionsHtml = `<h3 style="margin-top:24px">Suggestions</h3><ul style="padding-left:20px">${result.suggestions.map((s) => `<li style="padding:4px 0">${escapeHtml(s)}</li>`).join('')}</ul>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
  h2 { margin: 0 0 4px; }
  h3 { margin: 16px 0 8px; }
  .summary { display: flex; gap: 24px; margin: 16px 0; align-items: center; }
  .score-badge {
    width: 80px; height: 80px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: bold; color: #fff;
    background: ${scoreColor};
  }
  .stats { display: flex; gap: 16px; font-size: 13px; }
  .stat { text-align: center; }
  .stat-num { font-size: 18px; font-weight: bold; }
</style>
</head>
<body>
  <h2>${escapeHtml(slug)}</h2>
  <p style="opacity:0.6;margin:0">${escapeHtml(result.label)} (${result.score}/100)</p>
  <div class="summary">
    <div class="score-badge">${result.score}</div>
    <div class="stats">
      <div class="stat"><div class="stat-num" style="color:#4caf50">${passed.length}</div>Passed</div>
      <div class="stat"><div class="stat-num" style="color:#f44336">${failed.length}</div>Failed</div>
      <div class="stat"><div class="stat-num" style="color:#9e9e9e">${skipped.length}</div>Skipped</div>
    </div>
  </div>
  <h3>Assertions (${result.assertions.length})</h3>
  ${assertionsHtml}
  ${suggestionsHtml}
</body>
</html>`
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
