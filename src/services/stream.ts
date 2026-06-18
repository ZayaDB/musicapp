const CLIENTS = ['IOS', 'ANDROID', 'MWEB'] as const

let innertubeModule: typeof import('youtubei.js') | null = null

async function loadYoutubei() {
  if (!innertubeModule) {
    innertubeModule = await import('youtubei.js')
  }
  return innertubeModule
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const { Innertube, ClientType } = await loadYoutubei()
  let lastError: Error | null = null

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
