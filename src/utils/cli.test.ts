import assert from 'node:assert'
import { describe, it } from 'node:test'
import { RoleCraftError, RoleCraftJsonParseError, RoleCraftNotFoundError } from './errors.js'

describe('RoleCraftError', () => {
  it('should set name, message, exitCode, and stderr', () => {
    const error = new RoleCraftError('command failed', 1, 'some stderr')
    assert.strictEqual(error.name, 'RoleCraftError')
    assert.strictEqual(error.message, 'command failed')
    assert.strictEqual(error.exitCode, 1)
    assert.strictEqual(error.stderr, 'some stderr')
  })
})

describe('RoleCraftNotFoundError', () => {
  it('should set name and message with executable path', () => {
    const error = new RoleCraftNotFoundError('/usr/local/bin/rolecraft')
    assert.strictEqual(error.name, 'RoleCraftNotFoundError')
    assert.ok(error.message.includes('/usr/local/bin/rolecraft'))
  })
})

describe('RoleCraftJsonParseError', () => {
  it('should set name and truncate long output', () => {
    const longOutput = 'x'.repeat(300)
    const error = new RoleCraftJsonParseError(longOutput)
    assert.strictEqual(error.name, 'RoleCraftJsonParseError')
    assert.ok(error.message.length < 300)
  })

  it('should handle empty output', () => {
    const error = new RoleCraftJsonParseError('(empty output)')
    assert.strictEqual(error.name, 'RoleCraftJsonParseError')
    assert.ok(error.message.includes('(empty output)'))
  })
})
