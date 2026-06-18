const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const { resolveWithYoutubei } = require('./lib/resolve-audio.cjs')

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

  try {
    const result = await resolveWithYoutubei(videoId)
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        videoId,
        mimeType: result.mimeType,
        title: result.title,
        artist: result.artist,
      }),
    }
  } catch (e) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({
        error: e instanceof Error ? e.message : '다운로드 URL을 가져오지 못했습니다',
      }),
    }
  }
}
