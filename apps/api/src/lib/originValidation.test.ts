import { describe, it, expect } from 'vitest'
import { validateOrigin, validateOrigins, normalizeOrigin } from './originValidation'

describe('Origin Validation', () => {
  describe('Valid origins', () => {
    it('accepts HTTPS origins', () => {
      const result = validateOrigin('https://example.com')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts localhost HTTP', () => {
      const result = validateOrigin('http://localhost')
      expect(result.valid).toBe(true)
    })

    it('accepts localhost with port', () => {
      const result = validateOrigin('http://localhost:3000')
      expect(result.valid).toBe(true)
    })

    it('accepts 127.0.0.1 HTTP', () => {
      const result = validateOrigin('http://127.0.0.1:3000')
      expect(result.valid).toBe(true)
    })

    it('accepts HTTPS with non-default port', () => {
      const result = validateOrigin('https://example.com:8443')
      expect(result.valid).toBe(true)
    })

    it('accepts subdomain origins', () => {
      const result = validateOrigin('https://app.example.com')
      expect(result.valid).toBe(true)
    })
  })

  describe('Invalid origins', () => {
    it('rejects HTTP for non-localhost', () => {
      const result = validateOrigin('http://example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('HTTP only allowed for localhost')
    })

    it('rejects wildcard domains', () => {
      const result = validateOrigin('https://*.example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Wildcards not allowed in origin')
    })

    it('rejects origins with paths', () => {
      const result = validateOrigin('https://example.com/path')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('protocol + domain only')
    })

    it('rejects origins with query params', () => {
      const result = validateOrigin('https://example.com?query=1')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('protocol + domain only')
    })

    it('rejects origins with hash', () => {
      const result = validateOrigin('https://example.com#hash')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('protocol + domain only')
    })

    it('rejects origins with default HTTPS port', () => {
      const result = validateOrigin('https://example.com:443')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Do not include default ports')
    })

    it('rejects origins with default HTTP port', () => {
      const result = validateOrigin('http://localhost:80')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Do not include default ports')
    })

    it('rejects FTP protocol', () => {
      const result = validateOrigin('ftp://example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only HTTPS and localhost HTTP allowed')
    })

    it('rejects malformed URLs', () => {
      const result = validateOrigin('not-a-url')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })

    it('rejects empty string', () => {
      const result = validateOrigin('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })
  })
})

describe('Origins Array Validation', () => {
  it('validates array of valid origins', () => {
    const result = validateOrigins([
      'https://example.com',
      'https://app.example.com',
      'http://localhost:3000',
    ])
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects non-array input', () => {
    const result = validateOrigins('not-an-array' as any)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Origins must be an array')
  })

  it('rejects empty array', () => {
    const result = validateOrigins([])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('At least one origin is required')
  })

  it('rejects too many origins', () => {
    const manyOrigins = Array.from(
      { length: 11 },
      (_, i) => `https://example${i}.com`
    )
    const result = validateOrigins(manyOrigins)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Maximum 10 origins allowed')
  })

  it('rejects duplicate origins', () => {
    const result = validateOrigins([
      'https://example.com',
      'https://example.com',
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Duplicate origins not allowed')
  })

  it('identifies invalid origin in array', () => {
    const result = validateOrigins([
      'https://example.com',
      'http://insecure.com', // Invalid
      'https://app.example.com',
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('HTTP only allowed for localhost')
    expect(result.invalidOrigin).toBe('http://insecure.com')
  })

  it('rejects non-string items', () => {
    const result = validateOrigins([
      'https://example.com',
      123 as any, // Invalid type
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Each origin must be a string')
    expect(result.invalidOrigin).toBe('123')
  })
})

describe('Origin Normalization', () => {
  it('normalizes HTTPS origin', () => {
    const normalized = normalizeOrigin('https://example.com/')
    expect(normalized).toBe('https://example.com')
  })

  it('removes default HTTPS port', () => {
    const normalized = normalizeOrigin('https://example.com:443')
    expect(normalized).toBe('https://example.com')
  })

  it('removes default HTTP port', () => {
    const normalized = normalizeOrigin('http://localhost:80')
    expect(normalized).toBe('http://localhost')
  })

  it('preserves non-default ports', () => {
    const normalized = normalizeOrigin('https://example.com:8443')
    expect(normalized).toBe('https://example.com:8443')
  })

  it('preserves localhost with port', () => {
    const normalized = normalizeOrigin('http://localhost:3000')
    expect(normalized).toBe('http://localhost:3000')
  })

  it('handles invalid URLs gracefully', () => {
    const normalized = normalizeOrigin('not-a-url')
    expect(normalized).toBe('not-a-url')
  })

  it('normalizes subdomains', () => {
    const normalized = normalizeOrigin('https://app.example.com/')
    expect(normalized).toBe('https://app.example.com')
  })
})
