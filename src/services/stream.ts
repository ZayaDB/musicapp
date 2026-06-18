import type { Innertube } from 'youtubei.js'

let innertubePromise: Promise<Innertube> | null = null

async function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = (async () => {
      const { Innertube, ClientType } = await import('youtubei.js')
      return Innertube.create({
        client_type: ClientType.IOS,
        retrieve_player: false,
      })
    })()
  }
  return innertubePromise
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const yt = await getInnertube()
  const info = await yt.getBasicInfo(videoId)
  const format = info.chooseFormat({ type: 'audio', quality: 'best' })

  if (!format?.url) {
    throw new Error('재생 URL을 가져올 수 없습니다. 다른 곡을 시도해 보세요.')
  }

  return format.url
}
