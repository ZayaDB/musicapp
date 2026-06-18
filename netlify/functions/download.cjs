const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const CLIENTS = ['IOS', 'ANDROID', 'MWEB']

async function resolveWithYoutubei(videoId) {
  const { Innertube, ClientType } = await import('youtubei.js')
  let lastError = null

  for (const name of CLIENTS) {
    try {
      const clientType = ClientType[name]
      if (!clientType) continue

      const yt = await Innertube.create({ client_type: clientType })
      const info = await yt.getBasicInfo(videoId)
      const format = info.chooseFormat({ type: 'audio', quality: 'best' })
      if (!format) continue

      let url = format.url
      if (!url) {
        url = await format.decipher(yt.session.player)
      }
      if (url) {
        return {
          url,
          mimeType: format.mime_type || 'audio/mp4',
          title: info.basic_info?.title,
          artist: info.basic_info?.author,
        }
      }
    } catch (e) {
      lastError = e
    }
  }

  throw lastError || new Error('스트림 URL을 찾을 수 없습니다')
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

  try {
    const result = await resolveWithYoutubei(videoId)
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(result),
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
