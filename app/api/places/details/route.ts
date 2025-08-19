import { NextRequest, NextResponse } from 'next/server'

// Try to extract a usable text query from various Google Maps URL formats, including short links
const normalizeQuery = async (query: string): Promise<string> => {
  try {
    // If this is not a URL, just return as-is
    let url: URL | null = null
    try { url = new URL(query) } catch {}
    if (!url) return query

    const hostname = url.hostname

    // For short links like maps.app.goo.gl/<code>, we cannot follow redirects server-side reliably without CORS headers from Google.
    // Attempt to resolve redirect server-side and parse the expanded URL.
    if (hostname.includes('maps.app.goo.gl')) {
      const resolved = await resolveGoogleShortLink(query)
      if (resolved) {
        try {
          const resolvedUrl = new URL(resolved)
          if (resolvedUrl.hostname.includes('google')) {
            // Parse the expanded Google Maps URL
            const parsed = parseGoogleMapsUrl(resolvedUrl)
            if (parsed) return parsed
          }
        } catch {}
      }
      // Fallback to original string if we cannot resolve
      return query
    }

    if (hostname.includes('google')) {
      const parsed = parseGoogleMapsUrl(url)
      if (parsed) return parsed
    }

    // Last resort: return original string
    return query
  } catch {
    return query
  }
}

// Parse a Google Maps URL into a likely place name for text search
const parseGoogleMapsUrl = (url: URL): string | null => {
  const pathParts = url.pathname.split('/')
  const placeIndex = pathParts.findIndex((p) => p === 'place')
  if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
    const candidate = pathParts[placeIndex + 1]
    if (candidate && !candidate.startsWith('@')) {
      return decodeURIComponent(candidate.replace(/\+/g, ' '))
    }
  }
  const q = url.searchParams.get('q')
  if (q) return decodeURIComponent(q.replace(/\+/g, ' '))
  const meaningful = pathParts.filter((p) => p && p !== 'maps' && p !== 'place' && !p.startsWith('@') && !p.startsWith('data=') && p.length > 2)
  if (meaningful.length) return decodeURIComponent(meaningful[0].replace(/\+/g, ' '))
  return null
}

// Attempt to resolve a maps.app.goo.gl short link to its final destination URL
const resolveGoogleShortLink = async (shortUrl: string): Promise<string | null> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)

    // First, try following redirects normally
    const resp = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Provide a common UA to avoid bot blocking
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
      },
      signal: controller.signal
    })
    clearTimeout(timeout)
    // If it followed, resp.url should be the final URL
    if (resp && typeof resp.url === 'string' && resp.url && !resp.url.includes('maps.app.goo.gl')) {
      return resp.url
    }

    // Fallback: try manual redirect to read the Location header
    const controller2 = new AbortController()
    const timeout2 = setTimeout(() => controller2.abort(), 3500)
    const resp2 = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
      },
      signal: controller2.signal
    })
    clearTimeout(timeout2)
    const location = resp2.headers.get('location')
    if (location) {
      try {
        const absolute = new URL(location, shortUrl).toString()
        return absolute
      } catch {
        return location
      }
    }
  } catch {}
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  // Test endpoint - if query is "test", return success
  if (query === 'test') {
    return NextResponse.json({ message: 'API route is working', query })
  }

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  // Use server-side API key for better security
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER || process.env.GOOGLE_MAPS_API_KEY_SERVER
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    // Normalize query first to support raw, long, and short Google Maps links
    const normalized = await normalizeQuery(query)
    // First, try to find the place using text search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(normalized)}&key=${apiKey}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status === 'OK' && searchData.results.length > 0) {
      // Get the first result (most relevant)
      const place = searchData.results[0]
      
      // Now get detailed information using the place_id
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,types&key=${apiKey}`
      
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      if (detailsData.status === 'OK') {
        return NextResponse.json({
          ...detailsData.result,
          place_id: place.place_id // Include the place_id for reviews
        })
      } else {
        // If details fail, return the search result
        return NextResponse.json({
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types,
          place_id: place.place_id // Include the place_id for reviews
        })
      }
    } else {
      return NextResponse.json({ error: 'No places found for this query' }, { status: 404 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
} 