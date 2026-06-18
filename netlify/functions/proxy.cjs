const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
}

const MAX_CHUNK = 512 * 1024

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'url 파라미터가 필요합니다' }),
    }
  }

  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: '잘못된 URL입니다' }),
    }
  }

  if (!parsed.hostname.includes('googlevideo.com') && !parsed.hostname.includes('youtube.com')) {
    return {
      statusCode: 403,
      headers: CORS,
      body: JSON.stringify({ error: '허용되지 않은 호스트입니다' }),
    }
  }

  const rangeHeader = event.headers.range || event.headers.Range
  let range = rangeHeader

  if (!range) {
    range = `bytes=0-${MAX_CHUNK - 1}`
  } else {
    const match = range.match(/bytes=(\d+)-(\d*)/)
    if (match) {
      const start = parseInt(match[1], 10)
      let end = match[2] ? parseInt(match[2], 10) : start + MAX_CHUNK - 1
      if (end - start + 1 > MAX_CHUNK) {
        end = start + MAX_CHUNK - 1
      }
      range = `bytes=${start}-${end}`
    }
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        Range: range,
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    })

    const headers = { ...CORS }
    const pass = ['content-type', 'content-length', 'content-range', 'accept-ranges']
    for (const key of pass) {
      const val = upstream.headers.get(key)
      if (val) headers[key] = val
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
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({
        error: e instanceof Error ? e.message : '프록시 다운로드 실패',
      }),
    }
  }
}
