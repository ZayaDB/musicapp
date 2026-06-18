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
      body: JSON.stringify({ error: 'YouTube API 키가 설정되지 않았습니다' }),
    }
  }

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '25')
    searchUrl.searchParams.set('q', q)
    searchUrl.searchParams.set('key', key)

    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (!searchRes.ok) {
      return {
        statusCode: searchRes.status,
        headers: CORS,
        body: JSON.stringify({ error: searchData.error?.message ?? 'YouTube 검색 실패' }),
      }
    }

    const videoIds = (searchData.items ?? [])
      .map((item) => item.id?.videoId)
      .filter(Boolean)

    if (videoIds.length === 0) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ items: [] }),
      }
    }

    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videosUrl.searchParams.set('part', 'contentDetails,snippet')
    videosUrl.searchParams.set('id', videoIds.join(','))
    videosUrl.searchParams.set('key', key)

    const videosRes = await fetch(videosUrl)
    const videosData = await videosRes.json()

    const durationMap = Object.fromEntries(
      (videosData.items ?? []).map((v) => [v.id, parseDuration(v.contentDetails?.duration)]),
    )

    const snippetMap = Object.fromEntries(
      (videosData.items ?? []).map((v) => [v.id, v.snippet]),
    )

    const items = (searchData.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => {
        const id = item.id.videoId
        const snippet = snippetMap[id] ?? item.snippet
        return {
          videoId: id,
          title: snippet?.title ?? item.snippet.title,
          artist: snippet?.channelTitle ?? item.snippet.channelTitle,
          thumbnail:
            snippet?.thumbnails?.medium?.url ??
            snippet?.thumbnails?.default?.url ??
            item.snippet.thumbnails?.medium?.url,
          duration: durationMap[id] ?? 0,
        }
      })

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ items }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e instanceof Error ? e.message : '검색 오류' }),
    }
  }
}

function parseDuration(iso) {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = Number(match[1] || 0)
  const m = Number(match[2] || 0)
  const s = Number(match[3] || 0)
  return h * 3600 + m * 60 + s
}
