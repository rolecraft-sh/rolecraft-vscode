import assert from 'node:assert'
import { describe, it } from 'node:test'
import { escapeHtml, getTestResultHtml, type TestResult } from '../utils/testResult.js'

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

  it('should escape double quotes', () => {
    assert.strictEqual(escapeHtml('a "b" c'), 'a &quot;b&quot; c')
  })

  it('should escape single quotes', () => {
    assert.strictEqual(escapeHtml("a 'b' c"), 'a &#39;b&#39; c')
  })

  it('should escape backslashes', () => {
    assert.strictEqual(escapeHtml('a\\b'), 'a&#92;b')
  })

  it('should escape multiple characters', () => {
    assert.strictEqual(
      escapeHtml('<div class="a">b & c</div>'),
      '&lt;div class=&quot;a&quot;&gt;b &amp; c&lt;/div&gt;',
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
  const mixedResult: TestResult = {
    skill: 'test-skill',
    score: 61,
    grade: 'C',
    label: 'Adequate',
    assertions: [
      { name: 'name-defined', pass: true, detail: 'frontmatter.name is defined', weight: 10 },
      { name: 'slug-defined', pass: false, detail: 'frontmatter.slug is undefined', weight: 5 },
      { name: 'code-block-lang', pass: null, detail: 'Code blocks have language tags', weight: 10 },
    ],
    suggestions: ['Add "slug" field to frontmatter'],
  }

  const passingResult: TestResult = {
    skill: 'test-skill',
    score: 95,
    grade: 'A',
    label: 'Excellent',
    assertions: [
      { name: 'name-defined', pass: true, detail: 'frontmatter.name is defined', weight: 10 },
    ],
    suggestions: [],
  }

  const failingResult: TestResult = {
    skill: 'test-skill',
    score: 20,
    grade: 'F',
    label: 'Poor',
    assertions: [
      { name: 'slug-defined', pass: false, detail: 'frontmatter.slug is undefined', weight: 5 },
    ],
    suggestions: ['Add "slug" field to frontmatter'],
  }

  it('should return valid HTML structure', () => {
    const html = getTestResultHtml('my-skill', mixedResult)
    assert.ok(html.includes('<!DOCTYPE html>'))
    assert.ok(html.includes('<html lang="en">'))
    assert.ok(html.includes('</html>'))
  })

  it('should show score', () => {
    const html = getTestResultHtml('my-skill', mixedResult)
    assert.ok(html.includes('61'))
    assert.ok(html.includes('Adequate'))
  })

  it('should color score badge based on score', () => {
    const passingHtml = getTestResultHtml('my-skill', passingResult)
    assert.ok(passingHtml.includes('#4caf50'))
  })

  it('should include slug in content', () => {
    const html = getTestResultHtml('my-skill', passingResult)
    assert.ok(html.includes('my-skill'))
  })

  it('should count passed, failed, and skipped assertions', () => {
    const html = getTestResultHtml('my-skill', mixedResult)
    assert.ok(html.includes('1</div>Passed'))
    assert.ok(html.includes('1</div>Failed'))
    assert.ok(html.includes('1</div>Skipped'))
  })

  it('should render assertions with pass/fail icons', () => {
    const html = getTestResultHtml('my-skill', mixedResult)
    assert.ok(html.includes('✅'))
    assert.ok(html.includes('❌'))
    assert.ok(html.includes('⏭️'))
  })

  it('should render suggestions when present', () => {
    const html = getTestResultHtml('my-skill', mixedResult)
    assert.ok(html.includes('Suggestions'))
    assert.ok(html.includes('Add &quot;slug&quot; field to frontmatter'))
  })

  it('should color low score badge red', () => {
    const html = getTestResultHtml('my-skill', failingResult)
    assert.ok(html.includes('#f44336'))
  })
})
