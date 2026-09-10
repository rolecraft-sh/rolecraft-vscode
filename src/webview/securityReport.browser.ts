declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void
  getState: () => unknown
  setState: (state: unknown) => void
}

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  file?: string
  line?: number
}

interface SecurityScanResult {
  score: number
  issues: SecurityIssue[]
  summary: string
}

const vscode = acquireVsCodeApi()

const severityColors: Record<SecurityIssue['severity'], string> = {
  critical: '#f44336',
  high: '#ff9800',
  medium: '#ffc107',
  low: '#4caf50',
}

function setGauge(score: number): void {
  const fill = document.querySelector<SVGCircleElement>('.gauge-fill')
  const label = document.querySelector<HTMLSpanElement>('.gauge-value')
  if (!fill || !label) return

  const normalized = Math.max(0, Math.min(100, score))
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - normalized / 100)
  fill.style.strokeDashoffset = String(offset)

  let color = '#f44336'
  if (normalized >= 85) color = '#4caf50'
  else if (normalized >= 70) color = '#8bc34a'
  else if (normalized >= 50) color = '#ff9800'
  else if (normalized >= 30) color = '#ff5722'
  fill.style.stroke = color

  label.textContent = String(normalized)
}

function renderIssues(issues: SecurityIssue[]): void {
  const container = document.querySelector<HTMLDivElement>('.issue-list')
  if (!container) return

  container.textContent = ''

  if (issues.length === 0) {
    const noIssues = document.createElement('div')
    noIssues.className = 'no-issues'
    const checkIcon = document.createElement('span')
    checkIcon.className = 'check-icon'
    checkIcon.textContent = '✓'
    const msg = document.createElement('p')
    msg.textContent = 'Security scan passed. No issues found.'
    noIssues.append(checkIcon, msg)
    container.append(noIssues)
    return
  }

  for (const [index, issue] of issues.entries()) {
    const details = document.createElement('details')
    details.className = 'issue-item'
    details.dataset.index = String(index)

    const summary = document.createElement('summary')

    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.style.background = severityColors[issue.severity]

    const msg = document.createElement('span')
    msg.className = 'issue-msg'
    msg.textContent = issue.message

    const severity = document.createElement('span')
    severity.className = 'issue-severity'
    severity.style.color = severityColors[issue.severity]
    severity.textContent = issue.severity.toUpperCase()

    summary.append(dot, msg, severity)

    const detailsDiv = document.createElement('div')
    detailsDiv.className = 'issue-details'

    if (issue.file) {
      const fileSpan = document.createElement('span')
      fileSpan.className = 'issue-meta'
      fileSpan.textContent = `📄 ${issue.file}`
      detailsDiv.append(fileSpan)
    }
    if (issue.line !== undefined) {
      const lineSpan = document.createElement('span')
      lineSpan.className = 'issue-meta'
      lineSpan.textContent = `📍 Line ${issue.line}`
      detailsDiv.append(lineSpan)
    }

    details.append(summary, detailsDiv)
    container.append(details)
  }
}

function setActionsVisible(visible: boolean): void {
  const actions = document.querySelector<HTMLDivElement>('.actions')
  if (actions) actions.classList.toggle('hidden', !visible)
}

function updateApproveButton(hasCritical: boolean): void {
  const btn = document.querySelector<HTMLButtonElement>('.approve-btn')
  if (btn) btn.disabled = hasCritical
}

function wireActions(): void {
  const scanAllBtn = document.querySelector<HTMLButtonElement>('.scan-all-btn')
  scanAllBtn?.addEventListener('click', () => {
    vscode.postMessage({ command: 'scanAll' })
  })

  const approveBtn = document.querySelector<HTMLButtonElement>('.approve-btn')
  approveBtn?.addEventListener('click', () => {
    vscode.postMessage({ command: 'approve' })
  })

  const rejectBtn = document.querySelector<HTMLButtonElement>('.reject-btn')
  rejectBtn?.addEventListener('click', () => {
    vscode.postMessage({ command: 'reject' })
  })

  const viewDetailsBtn = document.querySelector<HTMLButtonElement>('.view-details-btn')
  viewDetailsBtn?.addEventListener('click', () => {
    for (const d of document.querySelectorAll<HTMLDetailsElement>('.issue-item')) {
      d.open = true
    }
  })
}

window.addEventListener('message', (event) => {
  const message = event.data
  if (!message) return

  if (message.type === 'render') {
    const result = message.result as SecurityScanResult
    setGauge(result.score)

    const summary = document.querySelector<HTMLDivElement>('.summary-text')
    if (summary) summary.textContent = result.summary

    const critical = document.querySelector<HTMLSpanElement>('.count-critical')
    const high = document.querySelector<HTMLSpanElement>('.count-high')
    const medium = document.querySelector<HTMLSpanElement>('.count-medium')
    const low = document.querySelector<HTMLSpanElement>('.count-low')
    if (critical && high && medium && low) {
      critical.textContent = String(result.issues.filter((i) => i.severity === 'critical').length)
      high.textContent = String(result.issues.filter((i) => i.severity === 'high').length)
      medium.textContent = String(result.issues.filter((i) => i.severity === 'medium').length)
      low.textContent = String(result.issues.filter((i) => i.severity === 'low').length)
    }

    renderIssues(result.issues)

    if (message.showActions) {
      setActionsVisible(true)
      updateApproveButton(result.issues.some((i) => i.severity === 'critical'))
    } else {
      setActionsVisible(false)
    }
  }
})

wireActions()
