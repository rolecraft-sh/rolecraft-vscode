import type { TreeItem } from 'vscode'

export interface Skill {
  name: string
  slug: string
  owner: string
  description: string
  category: string
  version: string
  installed: boolean
  agents: string[]
  mcp_servers: string[]
}

export type MCPServerStatus = 'running' | 'stopped'

export interface MCPServer {
  name: string
  status: MCPServerStatus
  command: string
  args: string[]
  skills: string[]
}

export interface Profile {
  name: string
  active: boolean
  agents: string[]
  skillCount: number
}

export interface AgentInfo {
  name: string
  installed: boolean
  version?: string
  path?: string
}

export interface SkillInfo {
  name: string
  version: string
  installed: boolean
}

export interface Issue {
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

export interface DoctorResult {
  version: string
  nodeVersion: string
  agents: AgentInfo[]
  skills: SkillInfo[]
  issues: Issue[]
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  file?: string
  line?: number
}

export interface SecurityScanResult {
  score: number
  issues: SecurityIssue[]
  summary: string
}

export interface SkillTreeItem extends TreeItem {
  skill: Skill
}

export interface MCPTreeItem extends TreeItem {
  server: MCPServer
}

export interface ProfileTreeItem extends TreeItem {
  profile: Profile
}
