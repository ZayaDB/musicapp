const CLIENTS = ['IOS', 'ANDROID', 'MWEB', 'TV_EMBEDDED']

const urlCache = new Map()

function pickAudioFormat(info) {
  try {
    const preferred = info.chooseFormat({
      type: 'audio',
      quality: 'best',
      format: 'mp4',
    })
    if (preferred) return preferred
  } catch {
    // fall through
  }

  try {
    return info.chooseFormat({
      type: 'audio',
      quality: 'best',
    })
  } catch {
    return null
  }
}

async function resolveWithYoutubei(videoId) {
  const { Innertube, ClientType } = await import('youtubei.js')
  const errors = []

  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const name of CLIENTS) {
      try {
        const clientType = ClientType[name]
        if (!clientType) continue

        const yt = await Innertube.create({ client_type: clientType })
        const info = await yt.getBasicInfo(videoId)
        const format = pickAudioFormat(info)
        if (!format) {
          errors.push(`${name}:no-audio-format`)
          continue
        }

        let url = format.url
        if (!url) {
          try {
            url = await format.decipher(yt.session.player)
          } catch {
            errors.push(`${name}:decipher-failed`)
          }
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
        errors.push(`${name}:${e?.message || e}`)
      }
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  const reason = errors.slice(-3).join(' | ')
  throw new Error(`Streaming data not available${reason ? ` (${reason})` : ''}`)
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
