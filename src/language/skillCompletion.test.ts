import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CATEGORY_OPTIONS, FRONTMATTER_FIELD_NAMES } from './skillCompletion.js'

test('frontmatter fields exported', () => {
  assert.ok(Array.isArray(FRONTMATTER_FIELD_NAMES))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('name'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('slug'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('owner'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('description'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('category'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('mcp_servers'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('agents'))
  assert.ok(FRONTMATTER_FIELD_NAMES.includes('version'))
})

test('category options exported', () => {
  assert.ok(Array.isArray(CATEGORY_OPTIONS))
  assert.ok(CATEGORY_OPTIONS.includes('automation'))
  assert.ok(CATEGORY_OPTIONS.includes('security'))
})
