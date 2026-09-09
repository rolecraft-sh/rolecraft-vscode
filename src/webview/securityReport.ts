import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'
import type { SecurityScanResult, SkillListResult } from '../types.js'
import { runRolecraftJson } from '../utils/cli.js'
import { securityScanFromTest } from '../utils/securityScan.js'
import type { TestResult } from '../utils/testResult.js'

function getNonce(): string {
  const text = `${crypto.randomUUID()}${Date.now()}`
  return text.replace(/[^a-zA-Z0-9]/g, '')
}

function getHtml(
  webview: vscode.Webview,
  webviewScriptUri: vscode.Uri,
  cssUri: vscode.Uri,
): string {
  const nonce = getNonce()
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${webview.asWebviewUri(cssUri)}">
<title>Security Report</title>
</head>
<body>
  <div class="container">
    <div class="gauge-wrap">
      <svg viewBox="0 0 120 120" class="gauge">
        <circle class="gauge-bg" cx="60" cy="60" r="54"></circle>
        <circle class="gauge-fill" cx="60" cy="60" r="54"></circle>
      </svg>
      <div class="gauge-center">
        <span class="gauge-value">--</span>
        <span class="gauge-unit">/ 100</span>
      </div>
    </div>
    <p class="summary-text">No scan yet</p>

    <div class="risk-breakdown">
      <div class="risk-row"><span class="risk-dot" style="background:#f44336"></span>Critical <span class="count count-critical">0</span></div>
      <div class="risk-row"><span class="risk-dot" style="background:#ff9800"></span>High <span class="count count-high">0</span></div>
      <div class="risk-row"><span class="risk-dot" style="background:#ffc107"></span>Medium <span class="count count-medium">0</span></div>
      <div class="risk-row"><span class="risk-dot" style="background:#4caf50"></span>Low <span class="count count-low">0</span></div>
    </div>

    <div class="scan-actions">
      <button class="scan-all-btn">Scan All Skills</button>
    </div>

    <div class="issue-list"></div>

    <div class="actions hidden">
      <button class="approve-btn">Approve &amp; Install</button>
      <button class="reject-btn">Reject</button>
      <button class="view-details-btn">View Details</button>
    </div>
  </div>
  <script nonce="${nonce}" src="${webview.asWebviewUri(webviewScriptUri)}"></script>
</body>
</html>`
}

function slugToSkillPath(slug: string): string {
  const dirName = slug.replace('/', '-')
  return path.join(os.homedir(), '.agents', 'skills', dirName, 'SKILL.md')
}

export class SecurityReportViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'rolecraft.securityReport'

  private view?: vscode.WebviewView
  private pendingResult?: SecurityScanResult
  private pendingShowActions = false
  private pendingReject?: () => void

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media'),
        vscode.Uri.joinPath(this.extensionUri, 'dist'),
      ],
    }

    const scriptUri = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'securityReport.js')
    const cssUri = vscode.Uri.joinPath(this.extensionUri, 'media', 'securityReport.css')

    webviewView.webview.html = getHtml(webviewView.webview, scriptUri, cssUri)

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'scanAll') {
        await this.scanAllSkills()
      } else if (message.command === 'approve') {
        this.pendingResolve?.()
        this.pendingResolve = undefined
        this.pendingReject = undefined
        this.hideActions()
      } else if (message.command === 'reject') {
        this.pendingReject?.()
        this.pendingReject = undefined
        this.pendingResolve = undefined
        this.hideActions()
      }
    })

    if (this.pendingResult) {
      this.render(this.pendingResult, this.pendingShowActions)
      this.pendingResult = undefined
    }
  }

  public render(result: SecurityScanResult, showActions = false): void {
    if (this.view) {
      this.view.webview.postMessage({ type: 'render', result, showActions })
    } else {
      this.pendingResult = result
      this.pendingShowActions = showActions
      void vscode.commands.executeCommand('rolecraft.securityReport.focus')
    }
  }

  public hideActions(): void {
    this.view?.webview.postMessage({
      type: 'render',
      result: { score: 0, issues: [], summary: '' },
      showActions: false,
    })
  }

  public showInstallActions(result: SecurityScanResult): Promise<boolean> {
    this.render(result, true)

    return new Promise<boolean>((resolve) => {
      this.pendingResolve = () => resolve(true)
      this.pendingReject = () => resolve(false)
    })
  }

  private pendingResolve?: () => void

  public async scanAllSkills(): Promise<void> {
    try {
      const listResult = await runRolecraftJson<SkillListResult>(['list'])
      const slugs = Object.keys(listResult.skills)

      if (slugs.length === 0) {
        this.render({ score: 0, issues: [], summary: 'No skills installed' })
        return
      }

      const aggregated: SecurityScanResult = { score: 0, issues: [], summary: '' }

      for (const slug of slugs) {
        try {
          const skillPath = slugToSkillPath(slug)
          const testResult = await runRolecraftJson<TestResult>(['test', skillPath])
          const scan = securityScanFromTest(testResult)
          aggregated.issues.push(...scan.issues)
          aggregated.score += scan.score
        } catch {
          // skip skills that fail to test
        }
      }

      aggregated.score = Math.round(aggregated.score / slugs.length)
      aggregated.summary = `${slugs.length} skill(s) scanned`
      this.render(aggregated)
    } catch {
      this.render({ score: 0, issues: [], summary: 'Failed to list skills' })
    }
  }

  public async scanSingleSkill(slug: string): Promise<void> {
    try {
      const skillPath = slugToSkillPath(slug)
      const testResult = await runRolecraftJson<TestResult>(['test', skillPath])
      this.render(securityScanFromTest(testResult))
    } catch {
      this.render({ score: 0, issues: [], summary: `Failed to test: ${slug}` })
    }
  }
}
