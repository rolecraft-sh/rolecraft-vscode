import assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseSearchResults } from '../utils/search.js'

describe('parseSearchResults', () => {
  it('should parse empty output', () => {
    const result = parseSearchResults('')
    assert.deepStrictEqual(result, [])
  })

  it('should parse output with no results', () => {
    const output = '🔍 Search results for "xyz":\n\n0 result(s) found.'
    const result = parseSearchResults(output)
    assert.deepStrictEqual(result, [])
  })

  it('should parse single result', () => {
    const output = `📦 Registry results for "test":

  SLUG                      DESCRIPTION               VERSION  STARS  INSTALLS
  coverage-guard            Enforces 100% test cove…  v1.0.0   3      0

1 result(s) found.`

    const result = parseSearchResults(output)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].slug, 'coverage-guard')
    assert.strictEqual(result[0].version, 'v1.0.0')
    assert.strictEqual(result[0].stars, 3)
    assert.strictEqual(result[0].installs, 0)
  })

  it('should parse multiple results', () => {
    const output = `📦 Registry results for "test":

  SLUG                      DESCRIPTION               VERSION  STARS  INSTALLS
  coverage-guard            Enforces 100% test cove…  v1.0.0   3      0
  flaky-test-detector       Detect, analyze, and fi…  v1.0.0   3      0
  test-driven-development   Red-Green-Refactor, tes…  v1.0.0   0      0

3 result(s) found.`

    const result = parseSearchResults(output)
    assert.strictEqual(result.length, 3)
    assert.strictEqual(result[0].slug, 'coverage-guard')
    assert.strictEqual(result[1].slug, 'flaky-test-detector')
    assert.strictEqual(result[2].slug, 'test-driven-development')
  })

  it('should handle results with hyphens in slug', () => {
    const output = `📦 Registry results for "debug":

  SLUG                      DESCRIPTION               VERSION  STARS  INSTALLS
  debugging-and-error-rec…  Five-step triage: repro…  v1.0.0   0      0

1 result(s) found.`

    const result = parseSearchResults(output)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].slug, 'debugging-and-error-rec…')
  })

  it('should ignore non-result lines', () => {
    const output = `Some header text
📦 Registry results for "test":

  SLUG                      DESCRIPTION               VERSION  STARS  INSTALLS
  coverage-guard            Enforces 100% test cove…  v1.0.0   3      0

1 result(s) found.
Some footer text`

    const result = parseSearchResults(output)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].slug, 'coverage-guard')
  })
})
