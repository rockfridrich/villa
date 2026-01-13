import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW server for Node.js environment (Vitest)
 *
 * This server intercepts HTTP requests in integration tests
 * and returns mocked responses based on the handlers.
 *
 * Usage in tests:
 * ```ts
 * import { server } from '@/tests/mocks/server'
 * import { http, HttpResponse } from 'msw'
 *
 * // Override a handler for a specific test
 * server.use(
 *   http.get('/api/health', () => {
 *     return HttpResponse.json({ status: 'error' }, { status: 503 })
 *   })
 * )
 * ```
 */
export const server = setupServer(...handlers)
