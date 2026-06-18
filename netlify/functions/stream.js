const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const CLIENTS = ['IOS', 'ANDROID', 'WEB']

async function getAudioUrl(videoId) {
  const { Innertube, ClientType } = await import('youtubei.js')
  let lastError = null

  for (const name of CLIENTS) {
    try {
      const yt = await Innertube.create({ client_type: ClientType[name] })
      const info = await yt.getBasicInfo(videoId)
      const format = info.chooseFormat({ type: 'audio', quality: 'best' })
      if (!format) continue

      let url = format.url
      if (!url) {
        url = await format.decipher(yt.session.player)
      }
      if (url) return url
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw lastError ?? new Error('오디오 스트림을 찾을 수 없습니다')
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
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ url }),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '스트림 오류'
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: msg }),
    }
  }
}
