export const HOVER_FIELD_DESCRIPTIONS: Record<string, string> = {
  name: 'The human-readable name of the skill.',
  slug: 'A unique identifier for the skill used in CLI commands.',
  owner: 'The GitHub username of the skill creator.',
  description: 'A brief summary of what the skill does.',
  category: 'The category this skill belongs to, for easier discovery.',
  mcp_servers: 'A list of MCP servers required by this skill.',
  agents: 'A list of AI agents compatible with this skill.',
  version: 'The version of the skill.',
}

export function getHoverContent(field: string, word: string, isField: boolean): string | undefined {
  if (isField) {
    return HOVER_FIELD_DESCRIPTIONS[word]
  }

  switch (field) {
    case 'mcp_servers':
      return `**MCP Server**: ${word}\n\n[View in Registry](https://registry.rolecraft.sh/mcp/${word})`
    case 'slug':
      return `**Skill**: ${word}\n\n[Search in Registry](https://registry.rolecraft.sh/skills/${word})\n\nRun: \`rolecraft install ${word}\``
    case 'agents':
      return `**Agent**: ${word}\n\n[Agent Documentation](https://docs.rolecraft.sh/agents/${word})`
    case 'category':
      return `**Category**: ${word}\n\n[Browse ${word} skills](https://registry.rolecraft.sh/skills?category=${word})`
    default:
      return undefined
  }
}
