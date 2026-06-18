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

async function fetchPlayer(videoId, client) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        client.userAgent ||
        `com.google.android.youtube/${client.clientVersion} (Linux; U; Android 11) gzip`,
    },
    body: JSON.stringify({ context: { client }, videoId }),
  })

  if (!res.ok) throw new Error(`InnerTube HTTP ${res.status}`)
  return res.json()
}

async function getAudioUrl(videoId) {
  for (const client of [IOS_CLIENT, ANDROID_CLIENT]) {
    try {
      const data = await fetchPlayer(videoId, client)
      const ok = data.playabilityStatus?.status === 'OK' || data.streamingData
      if (!ok) continue

      const formats = data.streamingData?.adaptiveFormats ?? []
      const audio = formats
        .filter((f) => f.mimeType?.includes('audio') && f.url)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]

      if (audio?.url) return audio.url
    } catch {
      // try next client
    }
  }
  return null
}

module.exports = { getAudioUrl }
