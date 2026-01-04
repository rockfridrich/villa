import { Hono } from 'hono'

const avatars = new Hono()

/**
 * Available DiceBear styles
 */
const DICEBEAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'shapes',
  'thumbs',
] as const

/**
 * GET /avatars/:seed
 * Returns DiceBear avatar SVG or PNG
 *
 * Query params:
 * - style: DiceBear style (default: 'bottts')
 * - format: 'svg' | 'png' (default: 'svg')
 * - size: number in pixels (default: 200, max: 512)
 * - backgroundColor: hex color without # (default: transparent)
 * - seed: deterministic seed (from path param)
 */
avatars.get('/:seed', async (c) => {
  const seed = c.req.param('seed')
  const style = c.req.query('style') || 'bottts'
  const format = c.req.query('format') || 'svg'
  const size = Math.min(parseInt(c.req.query('size') || '200', 10), 512)
  const backgroundColor = c.req.query('backgroundColor') || ''

  // Validate style
  if (!DICEBEAR_STYLES.includes(style as any)) {
    return c.json(
      {
        error: 'Invalid style',
        availableStyles: DICEBEAR_STYLES,
      },
      400
    )
  }

  // Validate format
  if (format !== 'svg' && format !== 'png') {
    return c.json(
      {
        error: 'Invalid format. Use "svg" or "png"',
      },
      400
    )
  }

  try {
    // Build DiceBear API URL
    const params = new URLSearchParams({
      seed,
      size: size.toString(),
      ...(backgroundColor && { backgroundColor }),
    })

    const dicebearUrl = `https://api.dicebear.com/7.x/${style}/${format}?${params.toString()}`

    // Fetch from DiceBear
    const response = await fetch(dicebearUrl)

    if (!response.ok) {
      throw new Error(`DiceBear API error: ${response.status}`)
    }

    // Set appropriate content type
    const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png'

    // Return avatar with caching headers
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Avatar generation error:', error)
    return c.json(
      {
        error: 'Failed to generate avatar',
      },
      500
    )
  }
})

/**
 * GET /avatars (list available styles)
 */
avatars.get('/', (c) => {
  return c.json({
    styles: DICEBEAR_STYLES,
    usage: '/avatars/:seed?style=bottts&format=svg&size=200',
  })
})

export default avatars
