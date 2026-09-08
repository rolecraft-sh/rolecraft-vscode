import assert from 'node:assert'
import { describe, it } from 'node:test'

const REQUIRED_FIELDS = ['name', 'slug', 'owner', 'description'] as const
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/
const CATEGORY_OPTIONS = [
  'automation',
  'developer-tools',
  'devops',
  'documentation',
  'testing',
  'security',
  'data-processing',
  'code-generation',
  'analysis',
] as const

describe('SKILL.md Validation Patterns', () => {
  describe('slug pattern', () => {
    it('should accept valid kebab-case slugs', () => {
      assert.ok(SLUG_PATTERN.test('my-skill'))
      assert.ok(SLUG_PATTERN.test('skill'))
      assert.ok(SLUG_PATTERN.test('my-cool-skill'))
      assert.ok(SLUG_PATTERN.test('skill123'))
      assert.ok(SLUG_PATTERN.test('skill-123'))
      assert.ok(SLUG_PATTERN.test('a'))
    })

    it('should reject invalid slugs', () => {
      assert.ok(!SLUG_PATTERN.test('My-Skill'))
      assert.ok(!SLUG_PATTERN.test('my_skill'))
      assert.ok(!SLUG_PATTERN.test('my skill'))
      assert.ok(!SLUG_PATTERN.test('-my-skill'))
      assert.ok(!SLUG_PATTERN.test('my-skill-'))
      assert.ok(!SLUG_PATTERN.test('my--skill'))
      assert.ok(!SLUG_PATTERN.test(''))
    })
  })

  describe('semver pattern', () => {
    it('should accept valid semver versions', () => {
      assert.ok(SEMVER_PATTERN.test('1.0.0'))
      assert.ok(SEMVER_PATTERN.test('0.1.0'))
      assert.ok(SEMVER_PATTERN.test('10.20.30'))
      assert.ok(SEMVER_PATTERN.test('1.0.0-alpha'))
      assert.ok(SEMVER_PATTERN.test('1.0.0-alpha.1'))
      assert.ok(SEMVER_PATTERN.test('1.0.0-beta.1'))
      assert.ok(SEMVER_PATTERN.test('1.0.0-rc.1'))
    })

    it('should reject invalid versions', () => {
      assert.ok(!SEMVER_PATTERN.test('1.0'))
      assert.ok(!SEMVER_PATTERN.test('v1.0.0'))
      assert.ok(!SEMVER_PATTERN.test('1.0.0.0'))
      assert.ok(!SEMVER_PATTERN.test(''))
      assert.ok(!SEMVER_PATTERN.test('latest'))
    })
  })

  describe('category options', () => {
    it('should include expected categories', () => {
      assert.ok(CATEGORY_OPTIONS.includes('automation'))
      assert.ok(CATEGORY_OPTIONS.includes('developer-tools'))
      assert.ok(CATEGORY_OPTIONS.includes('devops'))
      assert.ok(CATEGORY_OPTIONS.includes('documentation'))
      assert.ok(CATEGORY_OPTIONS.includes('testing'))
      assert.ok(CATEGORY_OPTIONS.includes('security'))
      assert.ok(CATEGORY_OPTIONS.includes('data-processing'))
      assert.ok(CATEGORY_OPTIONS.includes('code-generation'))
      assert.ok(CATEGORY_OPTIONS.includes('analysis'))
    })

    it('should reject unknown categories', () => {
      assert.ok(!CATEGORY_OPTIONS.includes('unknown'))
      assert.ok(!CATEGORY_OPTIONS.includes(''))
    })
  })

  describe('required fields', () => {
    it('should have all required fields defined', () => {
      assert.strictEqual(REQUIRED_FIELDS.length, 4)
      assert.ok(REQUIRED_FIELDS.includes('name'))
      assert.ok(REQUIRED_FIELDS.includes('slug'))
      assert.ok(REQUIRED_FIELDS.includes('owner'))
      assert.ok(REQUIRED_FIELDS.includes('description'))
    })
  })

  describe('field value validation', () => {
    it('should validate mcp_servers items', () => {
      const pattern = /^[a-zA-Z0-9._-]+$/
      assert.ok(pattern.test('filesystem'))
      assert.ok(pattern.test('my-server'))
      assert.ok(pattern.test('server.v2'))
      assert.ok(pattern.test('my_server'))
      assert.ok(!pattern.test('server name'))
      assert.ok(!pattern.test('server/name'))
    })

    it('should validate agents items', () => {
      const pattern = /^[a-zA-Z0-9._-]+$/
      assert.ok(pattern.test('claude-code'))
      assert.ok(pattern.test('cursor'))
      assert.ok(pattern.test('openai'))
      assert.ok(!pattern.test('claude code'))
      assert.ok(!pattern.test('openai/gpt'))
    })
  })
})
