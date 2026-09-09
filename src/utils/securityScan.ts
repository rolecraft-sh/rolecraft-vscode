import type { SecurityIssue, SecurityScanResult } from '../types.js'
import type { TestResult } from './testResult.js'

function severityFor(assertion: { name: string; weight: number }): SecurityIssue['severity'] {
  const name = assertion.name.toLowerCase()
  if (name.includes('dangerous') || name.includes('secret') || name.includes('injection')) {
    return 'critical'
  }
  if (assertion.weight >= 10) return 'high'
  if (assertion.weight >= 5) return 'medium'
  return 'low'
}

export function securityScanFromTest(result: TestResult): SecurityScanResult {
  const issues: SecurityIssue[] = result.assertions.flatMap((a) => {
    if (a.pass !== false) return []
    const severity = severityFor(a)
    const lineMatch = a.detail.match(/line\s+(\d+)/i)
    return [
      {
        severity,
        message: a.detail,
        file: a.name,
        line: lineMatch ? Number(lineMatch[1]) : undefined,
      },
    ]
  })

  const label = result.grade ? `${result.grade}` : result.label
  const summary = `${label} | ${result.score}/100`

  return {
    score: result.score,
    issues,
    summary,
  }
}

export function issueCount(
  result: SecurityScanResult,
): Omit<Record<SecurityIssue['severity'], number>, never> &
  Record<SecurityIssue['severity'], number> {
  return {
    critical: result.issues.filter((i) => i.severity === 'critical').length,
    high: result.issues.filter((i) => i.severity === 'high').length,
    medium: result.issues.filter((i) => i.severity === 'medium').length,
    low: result.issues.filter((i) => i.severity === 'low').length,
  }
}
