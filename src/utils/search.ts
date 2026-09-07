export interface SearchResult {
  slug: string
  description: string
  version: string
  stars: number
  installs: number
}

export function parseSearchResults(output: string): SearchResult[] {
  const results: SearchResult[] = []
  const lines = output.split('\n')
  let inResults = false

  for (const line of lines) {
    if (line.includes('SLUG') && line.includes('DESCRIPTION')) {
      inResults = true
      continue
    }

    if (!inResults) continue

    const match = line.match(/^\s+(\S+)\s{2,}(.+?)\s{2,}v([\d.]+)\s+(\d+)\s+(\d+)\s*$/)
    if (match) {
      results.push({
        slug: match[1],
        description: match[2].trim(),
        version: `v${match[3]}`,
        stars: Number.parseInt(match[4], 10),
        installs: Number.parseInt(match[5], 10),
      })
    }
  }

  return results
}
