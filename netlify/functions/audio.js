const { getAudioUrl } = require('./lib/youtube-audio')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const MAX_CHUNK = 512 * 1024

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

  const range = event.headers.range || event.headers.Range
  if (!range) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Range header required' }),
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

    const cappedRange = capRange(range, MAX_CHUNK)
    const upstream = await fetch(streamUrl, {
      headers: { Range: cappedRange },
      signal: AbortSignal.timeout(20000),
    })

    if (!upstream.ok && upstream.status !== 206) {
      return {
        statusCode: upstream.status,
        headers: CORS,
        body: JSON.stringify({ error: '업스트림 오디오 요청 실패' }),
      }
    }

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

function capRange(rangeHeader, maxBytes) {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
  if (!match) return rangeHeader
  const start = Number(match[1])
  const end = match[2] ? Number(match[2]) : start + maxBytes - 1
  const cappedEnd = Math.min(end, start + maxBytes - 1)
  return `bytes=${start}-${cappedEnd}`
}
