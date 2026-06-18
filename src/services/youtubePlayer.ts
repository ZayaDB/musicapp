/* eslint-disable @typescript-eslint/no-explicit-any */

type YTPlayer = {
  loadVideoById: (id: string) => void
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  destroy: () => void
}

const YT_PLAYING = 1
const YT_PAUSED = 2
const YT_ENDED = 0

let apiReady: Promise<void> | null = null
let player: YTPlayer | null = null

function loadYoutubeApi(): Promise<void> {
  if (apiReady) return apiReady

  apiReady = new Promise((resolve) => {
    if ((window as any).YT?.Player) {
      resolve()
      return
    }

    const prev = (window as any).onYouTubeIframeAPIReady
    ;(window as any).onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    if (!document.querySelector('script[src*="iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })

  return apiReady
}

function getOrCreatePlayer(): Promise<YTPlayer> {
  return loadYoutubeApi().then(
    () =>
      new Promise((resolve, reject) => {
        if (player) {
          resolve(player)
          return
        }

        let host = document.getElementById('yt-player-host')
        if (!host) {
          host = document.createElement('div')
          host.id = 'yt-player-host'
          host.className = 'yt-player-host'
          document.body.appendChild(host)
        }

        player = new (window as any).YT.Player('yt-player-host', {
          height: '200',
          width: '200',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: { target: YTPlayer }) => resolve(e.target),
            onError: () => reject(new Error('YouTube 재생 오류')),
          },
        })
      }),
  )
}

export const YoutubeEmbed = {
  YT_PLAYING,
  YT_PAUSED,
  YT_ENDED,

  async play(videoId: string): Promise<YTPlayer> {
    const p = await getOrCreatePlayer()
    p.loadVideoById(videoId)
    return p
  },

  async getPlayer(): Promise<YTPlayer | null> {
    try {
      return await getOrCreatePlayer()
    } catch {
      return null
    }
  },

  destroy() {
    player?.destroy()
    player = null
  },
}

export type { YTPlayer }
