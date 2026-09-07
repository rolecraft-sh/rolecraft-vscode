export interface McpServerEntry {
  agent: string
  name: string
  command: string
}

export interface McpSearchItem {
  name: string
  description: string
  source: 'github' | 'npm'
  stars: number | null
  language: string | null
  keywords: string | null
}

const FOOTER_PATTERN = /result\(s\) found|No MCP/i

function parseTableRows(output: string, headers: string[]): string[][] {
  const lines = output.split('\n')
  const upper = lines.map((line) => line.toUpperCase())

  const headerIndex = upper.findIndex((line) => {
    let from = 0
    for (const header of headers) {
      const index = line.indexOf(header, from)
      if (index === -1) return false
      from = index + header.length
    }
    return true
  })

  if (headerIndex === -1) return []

  const starts: number[] = []
  let from = 0
  for (const header of headers) {
    const index = upper[headerIndex].indexOf(header, from)
    starts.push(index)
    from = index + header.length
  }

  const rows: string[][] = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || FOOTER_PATTERN.test(line.trim())) break
    if (starts[0] >= line.length) break

    const cells = starts.map((start, column) => {
      const end = column < starts.length - 1 ? starts[column + 1] : line.length
      return line.slice(start, end).trim()
    })
    if (cells.every((cell) => cell === '')) continue
    rows.push(cells)
  }

  return rows
}

export function parseMcpList(output: string): McpServerEntry[] {
  const rows = parseTableRows(output, ['AGENT', 'SERVER', 'COMMAND'])
  return rows.map((row) => ({
    agent: row[0] ?? '',
    name: row[1] ?? '',
    command: row[2] ?? '',
  }))
}

export function parseMcpSearchResults(output: string, source: 'github' | 'npm'): McpSearchItem[] {
  if (source === 'github') {
    const rows = parseTableRows(output, ['REPOSITORY', 'DESCRIPTION', 'STARS', 'LANGUAGE'])
    return rows.map((row) => {
      const stars = Number.parseInt(row[2] ?? '', 10)
      const language = row[3] && row[3] !== 'N/A' ? row[3] : null
      return {
        name: row[0] ?? '',
        description: row[1] ?? '',
        source,
        stars: Number.isNaN(stars) ? null : stars,
        language,
        keywords: null,
      }
    })
  }

  const rows = parseTableRows(output, ['PACKAGE', 'DESCRIPTION', 'KEYWORDS'])
  return rows.map((row) => ({
    name: row[0] ?? '',
    description: row[1] ?? '',
    source,
    stars: null,
    language: null,
    keywords: row[2] ? row[2] : null,
  }))
}

export function mcpInstallSource(item: McpSearchItem): string {
  return item.source === 'npm' ? `npm:${item.name}` : `gh:${item.name}`
}
