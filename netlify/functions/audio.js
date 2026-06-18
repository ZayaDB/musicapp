const { getAudioUrl } = require('./lib/youtube-audio')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const videoId = event.queryStringParameters?.v?.trim()
  if (!videoId) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'videoId가 필요합니다' }),
    }
  }

  try {
    const streamUrl = await getAudioUrl(videoId)
    if (!streamUrl) {
      return {
        statusCode: 503,
        headers: CORS,
        body: JSON.stringify({ error: 'STREAM_UNAVAILABLE', fallback: 'youtube' }),
      }
    }

    const range = event.headers.range || event.headers.Range
    const upstreamHeaders = range ? { Range: range } : {}
    const upstream = await fetch(streamUrl, { headers: upstreamHeaders })
    const buffer = Buffer.from(await upstream.arrayBuffer())

    const headers = {
      ...CORS,
      'Content-Type': upstream.headers.get('content-type') || 'audio/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    }
    const contentRange = upstream.headers.get('content-range')
    const contentLength = upstream.headers.get('content-length')
    if (contentRange) headers['Content-Range'] = contentRange
    if (contentLength) headers['Content-Length'] = contentLength

    return {
      statusCode: upstream.status,
      headers,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (e) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({
        error: e instanceof Error ? e.message : '오디오 프록시 오류',
        fallback: 'youtube',
      }),
    }
  }
}
