const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const q = event.queryStringParameters?.q?.trim()
  if (!q) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: '검색어가 필요합니다' }),
    }
  }

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'YOUTUBE_API_KEY가 설정되지 않았습니다' }),
    }
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('type', 'video')
    url.searchParams.set('maxResults', '12')
    url.searchParams.set('q', q)
    url.searchParams.set('key', key)

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: CORS,
        body: JSON.stringify({ error: data.error?.message || 'YouTube 검색 실패' }),
      }
    }

    const items = (data.items || []).map((item) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title || '제목 없음',
      artist: item.snippet?.channelTitle || 'Unknown',
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        '',
    }))

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ items }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: e instanceof Error ? e.message : '검색 중 오류가 발생했습니다',
      }),
    }
  }
}
