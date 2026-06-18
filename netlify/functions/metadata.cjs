const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'YouTube API 키가 설정되지 않았습니다' }),
    }
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', key)

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || !data.items?.[0]) {
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: '영상 정보를 찾을 수 없습니다' }),
      }
    }

    const snippet = data.items[0].snippet
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        title: snippet.title,
        artist: snippet.channelTitle,
        thumbnail:
          snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? '',
      }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e instanceof Error ? e.message : '메타데이터 오류' }),
    }
  }
}
