import { describe, expect, it } from 'vitest'
import { normalizeExternalUrl } from '../src/url.ts'

describe('normalizeExternalUrl', () => {
  it('prepends https to scheme-less values and trims surrounding whitespace', () => {
    expect(normalizeExternalUrl('bilibili.com/video/bv1')).toBe('https://bilibili.com/video/bv1')
    expect(normalizeExternalUrl('  bilibili.com/x ')).toBe('https://bilibili.com/x')
  })

  it('leaves absolute and protocol-relative values untouched', () => {
    expect(normalizeExternalUrl('https://bilibili.com/x')).toBe('https://bilibili.com/x')
    expect(normalizeExternalUrl('HTTP://example.com')).toBe('HTTP://example.com')
    expect(normalizeExternalUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(normalizeExternalUrl('//example.com/x')).toBe('//example.com/x')
  })

  it('returns an empty or whitespace-only value as-is after trim', () => {
    expect(normalizeExternalUrl('')).toBe('')
    expect(normalizeExternalUrl('   ')).toBe('')
  })
})
