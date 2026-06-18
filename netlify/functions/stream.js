const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

async function getAudioUrl(videoId) {
  const { Innertube, ClientType } = await import('youtubei.js')
  const yt = await Innertube.create({
    client_type: ClientType.IOS,
    retrieve_player: false,
  })
  const info = await yt.getBasicInfo(videoId)
  const format = info.chooseFormat({ type: 'audio', quality: 'best' })
  return format?.url ?? null
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
