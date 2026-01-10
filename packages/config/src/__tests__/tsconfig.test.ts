import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('TypeScript configs', () => {
  describe('base.json', () => {
    test('can be imported and parsed', () => {
      const configPath = join(__dirname, '../../tsconfig/base.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config).toBeDefined()
      expect(config).toBeTypeOf('object')
    })

    test('has expected compilerOptions', () => {
      const configPath = join(__dirname, '../../tsconfig/base.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.compilerOptions).toBeDefined()
      expect(config.compilerOptions.strict).toBe(true)
      expect(config.compilerOptions.target).toBe('ES2022')
      expect(config.compilerOptions.module).toBe('ESNext')
      expect(config.compilerOptions.moduleResolution).toBe('bundler')
    })

    test('has valid schema reference', () => {
      const configPath = join(__dirname, '../../tsconfig/base.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.$schema).toBe('https://json.schemastore.org/tsconfig')
    })

    test('excludes node_modules', () => {
      const configPath = join(__dirname, '../../tsconfig/base.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.exclude).toContain('node_modules')
    })
  })

  describe('nextjs.json', () => {
    test('can be imported and parsed', () => {
      const configPath = join(__dirname, '../../tsconfig/nextjs.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config).toBeDefined()
      expect(config).toBeTypeOf('object')
    })

    test('extends base.json', () => {
      const configPath = join(__dirname, '../../tsconfig/nextjs.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.extends).toBe('./base.json')
    })

    test('has Next.js specific configuration', () => {
      const configPath = join(__dirname, '../../tsconfig/nextjs.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.compilerOptions).toBeDefined()
      expect(config.compilerOptions.jsx).toBe('preserve')
      expect(config.compilerOptions.plugins).toBeDefined()
      expect(config.compilerOptions.plugins).toHaveLength(1)
      expect(config.compilerOptions.plugins[0].name).toBe('next')
    })

    test('has valid schema reference', () => {
      const configPath = join(__dirname, '../../tsconfig/nextjs.json')
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(config.$schema).toBe('https://json.schemastore.org/tsconfig')
    })
  })
})
