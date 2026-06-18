import { saveTrack } from './db'

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

export async function fetchYoutubeMetadata(
  youtubeUrl: string,
): Promise<{ title: string; artist: string; thumbnail: string } | null> {
  const videoId = extractVideoId(youtubeUrl.trim())
  if (!videoId) return null

  try {
    const res = await fetch(`/api/metadata?v=${encodeURIComponent(videoId)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.src = url
    audio.addEventListener('loadedmetadata', () => {
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0)
      URL.revokeObjectURL(url)
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(0)
    })
  })
}

function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

const DEFAULT_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#d946ef"/>
    </linearGradient></defs>
    <rect width="200" height="200" fill="url(#g)"/>
    <path fill="white" d="M100 55v70a20 20 0 1 0 12 18V75h28V55H100z"/>
  </svg>`,
  )

export async function importAudioFile(
  file: File,
  options?: { title?: string; artist?: string; youtubeUrl?: string },
): Promise<string> {
  let title = options?.title?.trim() || titleFromFileName(file.name)
  let artist = options?.artist?.trim() || 'Unknown'
  let thumbnail = DEFAULT_THUMB
  let youtubeUrl = options?.youtubeUrl?.trim() || undefined

  if (youtubeUrl) {
    const meta = await fetchYoutubeMetadata(youtubeUrl)
    if (meta) {
      title = options?.title?.trim() || meta.title
      artist = options?.artist?.trim() || meta.artist
      thumbnail = meta.thumbnail
    }
  }

  const [duration] = await Promise.all([readAudioDuration(file)])
  const id = crypto.randomUUID()

  await saveTrack({
    id,
    title,
    artist,
    thumbnail,
    duration,
    fileName: file.name,
    addedAt: Date.now(),
    isFavorite: false,
    youtubeUrl,
    blob: file,
  })

  return id
}
