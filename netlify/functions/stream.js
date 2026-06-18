const ytdl = require('@distube/ytdl-core')

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
    const info = await ytdl.getInfo(videoId)
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    if (!format?.url) {
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: '오디오 스트림을 찾을 수 없습니다' }),
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ url: format.url }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e instanceof Error ? e.message : '스트림 오류' }),
    }
  }
}
