const IOS_CLIENT = {
  clientName: 'IOS',
  clientVersion: '20.03.3',
  deviceModel: 'iPhone14,3',
  userAgent: 'com.google.ios.youtube/20.03.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
  osName: 'iPhone',
  osVersion: '15.6',
  hl: 'en',
  gl: 'US',
}

const ANDROID_CLIENT = {
  clientName: 'ANDROID',
  clientVersion: '20.03.38',
  androidSdkVersion: 30,
  hl: 'en',
  gl: 'US',
}

const INVIDIOUS_INSTANCES = [
  'invidious.ducks.party',
  'inv.nadeko.net',
  'invidious.f5.si',
  'yewtu.be',
  'vid.puffyan.us',
]

async function fetchInnertube(videoId, client, baseUrl) {
  const res = await fetch(`${baseUrl}/youtubei/v1/player?prettyPrint=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        client.userAgent ||
        `com.google.android.youtube/${client.clientVersion} (Linux; U; Android 11) gzip`,
    },
    body: JSON.stringify({
      context: { client },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`InnerTube HTTP ${res.status}`)
  return res.json()
}

function pickAudioUrl(data) {
  const formats = data.streamingData?.adaptiveFormats ?? []
  const audio = formats
    .filter((f) => f.mimeType?.includes('audio') && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
  return audio?.url ?? null
}

async function getAudioUrlFromInvidious(videoId) {
  for (const host of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`https://${host}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const audio = (data.adaptiveFormats ?? [])
        .filter((f) => f.type?.includes('audio') && f.url)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      if (audio?.url) return audio.url
    } catch {
      // try next
    }
  }
  return null
}

async function getAudioUrl(videoId) {
  const poToken = process.env.YOUTUBE_PO_TOKEN
  const bases = ['https://www.youtube.com', 'https://music.youtube.com']

  for (const base of bases) {
    for (const client of [IOS_CLIENT, ANDROID_CLIENT]) {
      try {
        const body = {
          context: { client },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }
        if (poToken) {
          body.serviceIntegrityDimensions = { poToken }
        }

        const res = await fetch(`${base}/youtubei/v1/player?prettyPrint=false`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              client.userAgent ||
              `com.google.android.youtube/${client.clientVersion} (Linux; U; Android 11) gzip`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        })

        if (!res.ok) continue
        const data = await res.json()
        const url = pickAudioUrl(data)
        if (url) return url
      } catch {
        // try next
      }
    }
  }

  return getAudioUrlFromInvidious(videoId)
}

module.exports = { getAudioUrl }
