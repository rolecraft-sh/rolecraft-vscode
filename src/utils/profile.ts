export interface ProfileSummary {
  name: string
  agentCount: number
  description: string | null
  updatedAt: string | null
}

const FOOTER_PATTERN = /profile\(s\) total/i

export function parseProfileList(output: string): ProfileSummary[] {
  const lines = output.split('\n')
  const startIndex = lines.findIndex((line) => /Saved profiles:/i.test(line))
  if (startIndex === -1) return []

  const profiles: ProfileSummary[] = []
  let current: ProfileSummary | undefined

  const flush = (): void => {
    if (current) {
      profiles.push(current)
      current = undefined
    }
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '' || FOOTER_PATTERN.test(trimmed)) {
      flush()
      if (FOOTER_PATTERN.test(trimmed)) break
      continue
    }

    const detail = trimmed.match(/^[├└]─\s+(.*)$/)
    if (detail) {
      if (!current) continue
      const content = detail[1]
      if (/^Agents:\s*\d+$/.test(content)) {
        current.agentCount = Number.parseInt(content.slice(7), 10)
      } else if (/^Updated:/.test(content)) {
        current.updatedAt = content.replace(/^Updated:\s*/, '').trim()
      } else if (trimmed.startsWith('├─')) {
        current.description = content
      }
      continue
    }

    if (/^\s{3}\S/.test(line)) {
      flush()
      current = {
        name: trimmed,
        agentCount: 0,
        description: null,
        updatedAt: null,
      }
    }
  }

  flush()
  return profiles
}
