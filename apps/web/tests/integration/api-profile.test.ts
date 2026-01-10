/**
 * Integration tests for Profile API endpoints
 *
 * Tests profile creation, updates, and nickname management
 * with MSW mocked responses.
 */

import { describe, test, expect } from 'vitest'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('Profile API - POST /api/profile', () => {
  test('creates profile with valid data', async () => {
    const profileData = {
      address: '0x1234567890123456789012345678901234567890',
      nickname: 'testuser',
      avatar: {
        style: 'avataaars',
        selection: 'male',
        variant: 42,
      },
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toMatchObject({
      address: profileData.address.toLowerCase(),
      nickname: profileData.nickname,
      nicknameNormalized: profileData.nickname.toLowerCase(),
      avatar: profileData.avatar,
    })
    expect(data.createdAt).toBeDefined()
    expect(data.nicknameChangeCount).toBe(0)
  })

  test('creates profile without avatar', async () => {
    const profileData = {
      address: '0x1234567890123456789012345678901234567890',
      nickname: 'testuser',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.avatar).toBeNull()
  })

  test('rejects invalid address format', async () => {
    const profileData = {
      address: 'invalid-address',
      nickname: 'testuser',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid address format')
  })

  test('rejects short nickname', async () => {
    const profileData = {
      address: '0x1234567890123456789012345678901234567890',
      nickname: 'ab',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('at least 3 characters')
  })

  test('handles duplicate nickname', async () => {
    // Override handler to simulate duplicate nickname
    server.use(
      http.post('http://localhost:3000/api/profile', () => {
        return HttpResponse.json(
          { error: 'Nickname is already taken' },
          { status: 409 }
        )
      })
    )

    const profileData = {
      address: '0x1234567890123456789012345678901234567890',
      nickname: 'existinguser',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toBe('Nickname is already taken')
  })

  test('handles database unavailable', async () => {
    // Override handler to simulate database unavailable
    server.use(
      http.post('http://localhost:3000/api/profile', () => {
        return HttpResponse.json(
          { error: 'Database not available', _noDb: true },
          { status: 503 }
        )
      })
    )

    const profileData = {
      address: '0x1234567890123456789012345678901234567890',
      nickname: 'testuser',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })

    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.error).toBe('Database not available')
    expect(data._noDb).toBe(true)
  })
})

describe('Profile API - PATCH /api/profile', () => {
  test('updates nickname successfully', async () => {
    const updateData = {
      address: '0x1234567890123456789012345678901234567890',
      newNickname: 'newnickname',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      address: updateData.address.toLowerCase(),
      nickname: updateData.newNickname,
      nicknameNormalized: updateData.newNickname.toLowerCase(),
    })
    expect(data.nicknameChangeCount).toBe(1)
    expect(data.lastNicknameChange).toBeDefined()
  })

  test('rejects invalid address format', async () => {
    const updateData = {
      address: 'invalid',
      newNickname: 'newnickname',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid address format')
  })

  test('rejects short nickname', async () => {
    const updateData = {
      address: '0x1234567890123456789012345678901234567890',
      newNickname: 'ab',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('at least 3 characters')
  })

  test('handles nickname change limit exceeded', async () => {
    // Override handler to simulate max changes reached
    server.use(
      http.patch('http://localhost:3000/api/profile', () => {
        return HttpResponse.json(
          {
            error: 'You have reached the maximum of 3 nickname change(s)',
            canChangeNickname: false,
          },
          { status: 403 }
        )
      })
    )

    const updateData = {
      address: '0x1234567890123456789012345678901234567890',
      newNickname: 'newnickname',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('maximum')
    expect(data.canChangeNickname).toBe(false)
  })

  test('handles profile not found', async () => {
    // Override handler to simulate profile not found
    server.use(
      http.patch('http://localhost:3000/api/profile', () => {
        return HttpResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      })
    )

    const updateData = {
      address: '0x9999999999999999999999999999999999999999',
      newNickname: 'newnickname',
    }

    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Profile not found')
  })
})

describe('Profile API - GET /api/profile/:address', () => {
  test('handles profile not found', async () => {
    const address = '0x1234567890123456789012345678901234567890'
    const response = await fetch(`http://localhost:3000/api/profile/${address}`)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Profile not found')
  })

  test('rejects invalid address format', async () => {
    const response = await fetch('http://localhost:3000/api/profile/invalid')

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid address format')
  })

  test('returns profile when found', async () => {
    const address = '0x1234567890123456789012345678901234567890'

    // Override handler to return a profile
    server.use(
      http.get(`http://localhost:3000/api/profile/${address}`, () => {
        return HttpResponse.json({
          address: address.toLowerCase(),
          nickname: 'testuser',
          nicknameNormalized: 'testuser',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nicknameChangeCount: 0,
          lastNicknameChange: null,
        })
      })
    )

    const response = await fetch(`http://localhost:3000/api/profile/${address}`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      address: address.toLowerCase(),
      nickname: 'testuser',
    })
  })
})

describe('Nickname API - Check Availability', () => {
  test('returns available for unclaimed nickname', async () => {
    const response = await fetch('http://localhost:3000/api/nicknames/check/testnick')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.available).toBe(true)
    expect(data.nickname).toBe('testnick')
  })

  test('returns unavailable for claimed nickname', async () => {
    // Override handler to simulate taken nickname
    server.use(
      http.get('http://localhost:3000/api/nicknames/check/testnick', () => {
        return HttpResponse.json({
          available: false,
          nickname: 'testnick',
        })
      })
    )

    const response = await fetch('http://localhost:3000/api/nicknames/check/testnick')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.available).toBe(false)
  })
})

describe('Nickname API - Reverse Lookup', () => {
  test('handles nickname not found', async () => {
    const address = '0x1234567890123456789012345678901234567890'
    const response = await fetch(`http://localhost:3000/api/nicknames/reverse/${address}`)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Nickname not found')
  })

  test('returns nickname when found', async () => {
    const address = '0x1234567890123456789012345678901234567890'

    // Override handler to return a nickname
    server.use(
      http.get(`http://localhost:3000/api/nicknames/reverse/${address}`, () => {
        return HttpResponse.json({
          nickname: 'testuser',
          address: address.toLowerCase(),
        })
      })
    )

    const response = await fetch(`http://localhost:3000/api/nicknames/reverse/${address}`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.nickname).toBe('testuser')
  })
})
