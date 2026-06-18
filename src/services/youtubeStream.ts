const CLIENTS = ['IOS', 'ANDROID', 'MWEB'] as const

let innertubeModule: typeof import('youtubei.js') | null = null

async function loadYoutubei() {
  if (!innertubeModule) {
    innertubeModule = await import('youtubei.js')
  }
  return innertubeModule
}

export interface AudioStreamInfo {
  url: string
  mimeType: string
  title?: string
  artist?: string
}

export async function resolveAudioOnClient(videoId: string): Promise<AudioStreamInfo | null> {
  const { Innertube, ClientType } = await loadYoutubei()

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
      if (!url) continue

      return {
        url,
        mimeType: format.mime_type || 'audio/mp4',
        title: info.basic_info?.title ?? undefined,
        artist: info.basic_info?.author ?? undefined,
      }
    } catch {
      // try next client
    }
  }
  return null
}

export async function resolveAudioUrl(videoId: string): Promise<AudioStreamInfo> {
  try {
    const res = await fetch(`/api/download?v=${encodeURIComponent(videoId)}`, {
      signal: AbortSignal.timeout(45000),
    })
    if (res.ok) return res.json()
  } catch {
    // server blocked — try client
  }

  const client = await resolveAudioOnClient(videoId)
  if (client) return client

  throw new Error('음원 URL을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.')
}
