import type { Track } from '../types'

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.in.projectsegfau.lt',
]

async function fetchWithFallback(path: string): Promise<Response> {
  let lastError: Error | null = null
  for (const base of INSTANCES) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(8000) })
      if (res.ok) return res
      lastError = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('모든 서버에 연결할 수 없습니다')
}

interface SearchItem {
  url: string
  title: string
  thumbnail: string
  uploaderName: string
  duration: number
  type?: string
}

function extractVideoId(url: string): string {
  return url.split('v=')[1]?.split('&')[0] ?? url.split('/').pop() ?? ''
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetchWithFallback(
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`,
  )
  const data = await res.json()
  const items: SearchItem[] = data.items ?? []

  return items
    .filter((item) => item.url && item.title)
    .map((item) => ({
      videoId: extractVideoId(item.url),
      title: item.title,
      artist: item.uploaderName ?? 'Unknown',
      thumbnail: item.thumbnail,
      duration: item.duration ?? 0,
    }))
    .filter((t) => t.videoId)
}

interface AudioStream {
  url: string
  bitrate: number
  mimeType: string
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const res = await fetchWithFallback(`/streams/${videoId}`)
  const data = await res.json()
  const streams: AudioStream[] = data.audioStreams ?? []

  if (streams.length === 0) {
    throw new Error('오디오 스트림을 찾을 수 없습니다')
  }

  const best = streams.reduce((a, b) => (b.bitrate > a.bitrate ? b : a))
  return best.url
}
