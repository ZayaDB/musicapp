const { getAudioUrl } = require('./lib/youtube-audio')

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

  try {
    const url = await getAudioUrl(videoId)
    if (!url) {
      return {
        statusCode: 503,
        headers: CORS,
        body: JSON.stringify({ error: 'STREAM_UNAVAILABLE', fallback: 'youtube' }),
      }
    }
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ url }),
    }
  } catch (e) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({
        error: e instanceof Error ? e.message : '스트림 오류',
        fallback: 'youtube',
      }),
    }
  }
}
