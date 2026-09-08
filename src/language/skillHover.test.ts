import assert from 'node:assert'
import { describe, it } from 'node:test'
import { getHoverContent } from './skillHoverUtils.js'

describe('SkillHoverProvider', () => {
  it('should return description for field names', () => {
    assert.strictEqual(
      getHoverContent('name', 'name', true),
      'The human-readable name of the skill.',
    )
    assert.strictEqual(
      getHoverContent('slug', 'slug', true),
      'A unique identifier for the skill used in CLI commands.',
    )
  })

  it('should return formatted markdown for values', () => {
    const slugContent = getHoverContent('slug', 'my-skill', false)
    assert.ok(slugContent?.includes('**Skill**: my-skill'))
    assert.ok(slugContent?.includes('registry.rolecraft.sh/skills/my-skill'))
  })

  it('should return undefined for unknown fields/values', () => {
    assert.strictEqual(getHoverContent('unknown', 'val', false), undefined)
    assert.strictEqual(getHoverContent('unknown', 'unknown', true), undefined)
  })
})
