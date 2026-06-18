const { getStreamUrl, clearCache } = require('./lib/resolve-audio.cjs')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
}

const MAX_CHUNK = 512 * 1024

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

async function fetchRange(streamUrl, range) {
  return fetch(streamUrl, {
    headers: { Range: range, 'User-Agent': UA },
  })
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const videoId = event.queryStringParameters?.v?.trim()
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: '유효한 videoId가 필요합니다' }),
    }
  }

  let range = event.headers.range || event.headers.Range || `bytes=0-${MAX_CHUNK - 1}`
  const match = range.match(/bytes=(\d+)-(\d*)/)
  if (match) {
    const start = parseInt(match[1], 10)
    let end = match[2] ? parseInt(match[2], 10) : start + MAX_CHUNK - 1
    if (end - start + 1 > MAX_CHUNK) end = start + MAX_CHUNK - 1
    range = `bytes=${start}-${end}`
  }

  try {
    let stream = await getStreamUrl(videoId)
    let upstream = await fetchRange(stream.url, range)

    if (upstream.status === 403 || upstream.status === 410) {
      clearCache(videoId)
      stream = await getStreamUrl(videoId, true)
      upstream = await fetchRange(stream.url, range)
    }

    if (!upstream.ok && upstream.status !== 206) {
      return {
        statusCode: upstream.status,
        headers: CORS,
        body: JSON.stringify({
          error: `음원 다운로드 실패 (${upstream.status}). 잠시 후 다시 시도해 주세요.`,
        }),
      }
    }

    const headers = { ...CORS }
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const val = upstream.headers.get(key)
      if (val) headers[key] = val
    }
    if (!headers['content-type']) {
      headers['content-type'] = stream.mimeType || 'audio/mp4'
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())

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
        error: e instanceof Error ? e.message : '다운로드 서버 오류',
      }),
    }
  }
}
