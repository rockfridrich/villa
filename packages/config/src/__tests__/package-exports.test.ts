import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Package exports', () => {
  test('package.json has exports field', () => {
    const packagePath = join(__dirname, '../../package.json')
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    expect(pkg.exports).toBeDefined()
    expect(pkg.exports).toBeTypeOf('object')
  })

  test('all exported paths exist', () => {
    const packagePath = join(__dirname, '../../package.json')
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    for (const [exportName, exportPath] of Object.entries(pkg.exports)) {
      const fullPath = join(__dirname, '../..', exportPath as string)
      expect(existsSync(fullPath), `Export "${exportName}" path "${exportPath}" should exist`).toBe(true)
    }
  })

  test('tsconfig/base export points to valid JSON', () => {
    const packagePath = join(__dirname, '../../package.json')
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    const basePath = pkg.exports['./tsconfig/base']
    expect(basePath).toBe('./tsconfig/base.json')

    const fullPath = join(__dirname, '../..', basePath)
    const configContent = readFileSync(fullPath, 'utf-8')

    // Should be valid JSON
    expect(() => JSON.parse(configContent)).not.toThrow()
  })

  test('tsconfig/nextjs export points to valid JSON', () => {
    const packagePath = join(__dirname, '../../package.json')
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    const nextjsPath = pkg.exports['./tsconfig/nextjs']
    expect(nextjsPath).toBe('./tsconfig/nextjs.json')

    const fullPath = join(__dirname, '../..', nextjsPath)
    const configContent = readFileSync(fullPath, 'utf-8')

    // Should be valid JSON
    expect(() => JSON.parse(configContent)).not.toThrow()
  })
})
