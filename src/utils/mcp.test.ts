import assert from 'node:assert'
import { describe, it } from 'node:test'
import { mcpInstallSource, parseMcpList, parseMcpSearchResults } from './mcp.js'

describe('parseMcpList', () => {
  it('should parse empty output', () => {
    assert.deepStrictEqual(parseMcpList(''), [])
  })

  it('should parse output with no servers configured', () => {
    const output = 'No MCP servers configured.'
    assert.deepStrictEqual(parseMcpList(output), [])
  })

  it('should parse configured servers', () => {
    const output = `
Configured MCP servers (2):

  AGENT     SERVER      COMMAND
  continue  filesystem  npx -y @modelcontextprotocol/server-filesystem
  continue  fetch       npx -y @modelcontextprotocol/server-fetch`
    const result = parseMcpList(output)
    assert.strictEqual(result.length, 2)
    assert.deepStrictEqual(result[0], {
      agent: 'continue',
      name: 'filesystem',
      command: 'npx -y @modelcontextprotocol/server-filesystem',
    })
    assert.deepStrictEqual(result[1], {
      agent: 'continue',
      name: 'fetch',
      command: 'npx -y @modelcontextprotocol/server-fetch',
    })
  })

  it('should ignore non-table lines', () => {
    const output = `Some header text

  AGENT     SERVER      COMMAND
  continue  filesystem  npx -y @modelcontextprotocol/server-filesystem

1 result(s) found.
Some footer text`
    const result = parseMcpList(output)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].name, 'filesystem')
  })
})

describe('parseMcpSearchResults (github)', () => {
  it('should parse empty output', () => {
    const result = parseMcpSearchResults('', 'github')
    assert.deepStrictEqual(result, [])
  })

  it('should parse output with no results', () => {
    const output = `
No MCP servers found for "xyz".`
    const result = parseMcpSearchResults(output, 'github')
    assert.deepStrictEqual(result, [])
  })

  it('should parse repository results', () => {
    const output = `
🔍 MCP server search results for "github":

  REPOSITORY                DESCRIPTION                STARS  LANGUAGE
  github/github-mcp-server  GitHub's official MCP Se…  32779  Go
  yusufkaraaslan/Skill_Se…  Convert documentation we…  14930  Python

10 result(s) found.`
    const result = parseMcpSearchResults(output, 'github')
    assert.strictEqual(result.length, 2)
    assert.deepStrictEqual(result[0], {
      name: 'github/github-mcp-server',
      description: "GitHub's official MCP Se…",
      source: 'github',
      stars: 32779,
      language: 'Go',
      keywords: null,
    })
    assert.strictEqual(result[1].name, 'yusufkaraaslan/Skill_Se…')
    assert.strictEqual(result[1].stars, 14930)
    assert.strictEqual(result[1].language, 'Python')
  })

  it('should handle missing stars and language', () => {
    const output = `
🔍 MCP server search results for "test":

  REPOSITORY                DESCRIPTION                STARS  LANGUAGE
  owner/repo                Some MCP server            N/A    N/A

1 result(s) found.`
    const result = parseMcpSearchResults(output, 'github')
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].stars, null)
    assert.strictEqual(result[0].language, null)
  })
})

describe('parseMcpSearchResults (npm)', () => {
  it('should parse package results', () => {
    const output = `
🔍 npm MCP packages for "postgres":

  PACKAGE                   DESCRIPTION               KEYWORDS
  ainative-postgres-mcp     Zero-config Postgres MC…  mcp, mcp-server, mcp-server-hosting
  @unified-product-graph/…  Postgres-backed MCP ser…  mcp, upg, unified-product-graph

20 result(s) found.`
    const result = parseMcpSearchResults(output, 'npm')
    assert.strictEqual(result.length, 2)
    assert.deepStrictEqual(result[0], {
      name: 'ainative-postgres-mcp',
      description: 'Zero-config Postgres MC…',
      source: 'npm',
      stars: null,
      language: null,
      keywords: 'mcp, mcp-server, mcp-server-hosting',
    })
    assert.strictEqual(result[1].name, '@unified-product-graph/…')
    assert.strictEqual(result[1].keywords, 'mcp, upg, unified-product-graph')
  })

  it('should return empty for header-only output', () => {
    const output = `
🔍 npm MCP packages for "test":

  PACKAGE                   DESCRIPTION               KEYWORDS`
    const result = parseMcpSearchResults(output, 'npm')
    assert.deepStrictEqual(result, [])
  })
})

describe('mcpInstallSource', () => {
  it('should build github source', () => {
    const item = {
      name: 'github/github-mcp-server',
      description: '',
      source: 'github' as const,
      stars: null,
      language: null,
      keywords: null,
    }
    assert.strictEqual(mcpInstallSource(item), 'gh:github/github-mcp-server')
  })

  it('should build npm source', () => {
    const item = {
      name: 'postgres-mcp-hardened',
      description: '',
      source: 'npm' as const,
      stars: null,
      language: null,
      keywords: null,
    }
    assert.strictEqual(mcpInstallSource(item), 'npm:postgres-mcp-hardened')
  })
})
