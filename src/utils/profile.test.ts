import assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseProfileList } from './profile.js'

describe('parseProfileList', () => {
  it('should parse empty output', () => {
    assert.deepStrictEqual(parseProfileList(''), [])
  })

  it('should parse output with no profiles saved', () => {
    const output = 'No profiles saved.'
    assert.deepStrictEqual(parseProfileList(output), [])
  })

  it('should parse a single profile', () => {
    const output = `
Saved profiles:

   scratch-profile-rc
   ├─ Agents: 3
   ├─ Saved on 9/7/2026
   └─ Updated: 9/7/2026

1 profile(s) total.`
    const result = parseProfileList(output)
    assert.strictEqual(result.length, 1)
    assert.deepStrictEqual(result[0], {
      name: 'scratch-profile-rc',
      agentCount: 3,
      description: 'Saved on 9/7/2026',
      updatedAt: '9/7/2026',
    })
  })

  it('should parse multiple profiles', () => {
    const output = `
Saved profiles:

   alpha
   ├─ Agents: 2
   └─ Updated: 9/1/2026

   beta
   ├─ Agents: 1
   ├─ Team setup profile
   └─ Updated: 9/7/2026

2 profile(s) total.`
    const result = parseProfileList(output)
    assert.strictEqual(result.length, 2)
    assert.deepStrictEqual(result[0], {
      name: 'alpha',
      agentCount: 2,
      description: null,
      updatedAt: '9/1/2026',
    })
    assert.deepStrictEqual(result[1], {
      name: 'beta',
      agentCount: 1,
      description: 'Team setup profile',
      updatedAt: '9/7/2026',
    })
  })

  it('should ignore non-profile lines before the header', () => {
    const output = `Some other output

Saved profiles:

   alpha
   └─ Updated: 9/1/2026

1 profile(s) total.
Trailing text`
    const result = parseProfileList(output)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].name, 'alpha')
  })
})
