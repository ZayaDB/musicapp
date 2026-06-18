const CLIENTS = ['IOS', 'ANDROID', 'MWEB']

const urlCache = new Map()

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

async function getStreamUrl(videoId, forceRefresh = false) {
  if (!forceRefresh) {
    const hit = urlCache.get(videoId)
    if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
      return hit
    }
  }

  const result = await resolveWithYoutubei(videoId)
  const entry = { ...result, at: Date.now() }
  urlCache.set(videoId, entry)
  return entry
}

function clearCache(videoId) {
  urlCache.delete(videoId)
}

module.exports = { getStreamUrl, clearCache, resolveWithYoutubei }
