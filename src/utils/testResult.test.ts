import assert from 'node:assert'
import { describe, it } from 'node:test'
import { type TestResult, escapeHtml, getTestResultHtml } from '../utils/testResult.js'

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b')
  })

  it('should escape less-than signs', () => {
    assert.strictEqual(escapeHtml('a < b'), 'a &lt; b')
  })

  it('should escape greater-than signs', () => {
    assert.strictEqual(escapeHtml('a > b'), 'a &gt; b')
  })

  it('should escape multiple characters', () => {
    assert.strictEqual(
      escapeHtml('<div class="a">b & c</div>'),
      '&lt;div class="a"&gt;b &amp; c&lt;/div&gt;',
    )
  })

  it('should return empty string unchanged', () => {
    assert.strictEqual(escapeHtml(''), '')
  })

  it('should return plain text unchanged', () => {
    assert.strictEqual(escapeHtml('hello world'), 'hello world')
  })
})

describe('getTestResultHtml', () => {
  const passedResult: TestResult = {
    slug: 'test-skill',
    passed: true,
    duration: '1.23s',
    details: 'All tests passed',
  }

  const failedResult: TestResult = {
    slug: 'test-skill',
    passed: false,
    duration: '0.5s',
    details: 'Assertion failed: expected 1 to equal 2',
  }

  it('should return valid HTML structure', () => {
    const html = getTestResultHtml('my-skill', passedResult)
    assert.ok(html.includes('<!DOCTYPE html>'))
    assert.ok(html.includes('<html lang="en">'))
    assert.ok(html.includes('</html>'))
  })

  it('should show PASSED status for passing result', () => {
    const html = getTestResultHtml('my-skill', passedResult)
    assert.ok(html.includes('PASSED'))
    assert.ok(html.includes('#4caf50'))
  })

  it('should show FAILED status for failing result', () => {
    const html = getTestResultHtml('my-skill', failedResult)
    assert.ok(html.includes('FAILED'))
    assert.ok(html.includes('#f44336'))
  })

  it('should include slug in title and content', () => {
    const html = getTestResultHtml('my-skill', passedResult)
    assert.ok(html.includes('<title>Test Result: my-skill</title>'))
    assert.ok(html.includes('Skill: my-skill'))
  })

  it('should include duration', () => {
    const html = getTestResultHtml('my-skill', passedResult)
    assert.ok(html.includes('Duration: 1.23s'))
  })

  it('should escape HTML in details', () => {
    const result: TestResult = {
      slug: 'test',
      passed: true,
      duration: '0s',
      details: '<script>alert("xss")</script>',
    }
    const html = getTestResultHtml('test', result)
    assert.ok(html.includes('&lt;script&gt;'))
    assert.ok(!html.includes('<script>'))
  })
})
