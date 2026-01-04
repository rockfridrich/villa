import { Hono } from 'hono'
import { cors } from './middleware/cors'
import { rateLimit } from './middleware/rateLimit'
import health from './routes/health'
import nicknames from './routes/nicknames'
import avatars from './routes/avatars'
import ens from './routes/ens'

/**
 * Villa API
 * Hono-based API service for Villa identity and storage
 */

const app = new Hono()

// Middleware
app.use('*', cors)
app.use('*', rateLimit)

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err)

  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500)
})

// Routes
app.route('/health', health)
app.route('/nicknames', nicknames)
app.route('/avatars', avatars)
app.route('/ens', ens)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Villa API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      nicknames: '/nicknames',
      avatars: '/avatars',
      ens: '/ens',
    },
  })
})

export default app
