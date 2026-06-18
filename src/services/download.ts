import { saveTrack, getAllTracks } from './db'
import { fetchYoutubeMetadata } from './upload'
import { resolveAudioUrl } from './youtubeStream'

const CHUNK_SIZE = 512 * 1024

export function extractVideoId(url: string): string | null {
  const match = url.trim().match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

export async function findTrackByVideoId(videoId: string) {
  const all = await getAllTracks()
  return all.find(
    (t) =>
      t.youtubeUrl?.includes(videoId) ||
      t.fileName === `${videoId}.m4a` ||
      t.fileName === `${videoId}.mp3`,
  )
}

function extFromMime(mime: string): string {
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3'
  if (mime.includes('webm')) return 'webm'
  return 'm4a'
}

async function probeContentLength(streamUrl: string): Promise<number> {
  const res = await fetch(
    `/api/proxy?url=${encodeURIComponent(streamUrl)}&probe=1`,
    { headers: { Range: 'bytes=0-0' } },
  )
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    const n = parseInt(total, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  const len = res.headers.get('content-length')
  return len ? parseInt(len, 10) : 0
}

async function downloadChunk(streamUrl: string, start: number, end: number): Promise<ArrayBuffer> {
  const res = await fetch(
    `/api/proxy?url=${encodeURIComponent(streamUrl)}`,
    { headers: { Range: `bytes=${start}-${end}` } },
  )
  if (!res.ok) {
    throw new Error(`다운로드 실패 (${res.status})`)
  }
  return res.arrayBuffer()
}

async function downloadToBlob(
  streamUrl: string,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const total = await probeContentLength(streamUrl)

  if (total > 0) {
    const parts: BlobPart[] = []
    let downloaded = 0
    for (let start = 0; start < total; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, total - 1)
      const buf = await downloadChunk(streamUrl, start, end)
      parts.push(buf)
      downloaded = end + 1
      onProgress(Math.min(99, Math.round((downloaded / total) * 100)))
    }
    return new Blob(parts, { type: 'audio/mp4' })
  }

  // content-length unknown — single chunk loop until short read
  const parts: BlobPart[] = []
  let start = 0
  let iterations = 0
  const maxIterations = 200

  while (iterations < maxIterations) {
    const end = start + CHUNK_SIZE - 1
    const buf = await downloadChunk(streamUrl, start, end)
    parts.push(buf)
    iterations++
    if (buf.byteLength < CHUNK_SIZE) break
    start += CHUNK_SIZE
    onProgress(Math.min(90, iterations * 5))
  }

  return new Blob(parts, { type: 'audio/mp4' })
}

function readBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
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

export async function downloadYoutubeToLibrary(
  youtubeUrl: string,
  onProgress: (stage: string, percent: number) => void,
): Promise<string> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) throw new Error('YouTube URL이 올바르지 않습니다')

  const existing = await findTrackByVideoId(videoId)
  if (existing) return existing.id

  onProgress('음원 찾는 중…', 5)
  const stream = await resolveAudioUrl(videoId)

  onProgress('다운로드 중…', 10)
  const blob = await downloadToBlob(stream.url, (p) => onProgress('다운로드 중…', 10 + p * 0.85))

  onProgress('저장 중…', 98)

  const meta =
    (await fetchYoutubeMetadata(youtubeUrl)) ||
    (stream.title
      ? { title: stream.title, artist: stream.artist || 'Unknown', thumbnail: '' }
      : null)

  const ext = extFromMime(stream.mimeType)
  const fileName = `${videoId}.${ext}`
  const duration = await readBlobDuration(blob)
  const id = crypto.randomUUID()

  const DEFAULT_THUMB =
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#8b5cf6"/><path fill="white" d="M100 55v70a20 20 0 1 0 12 18V75h28V55H100z"/></svg>`,
    )

  await saveTrack({
    id,
    title: meta?.title || `YouTube ${videoId}`,
    artist: meta?.artist || 'Unknown',
    thumbnail: meta?.thumbnail || DEFAULT_THUMB,
    duration,
    fileName,
    addedAt: Date.now(),
    isFavorite: false,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    blob,
  })

  onProgress('완료', 100)
  return id
}
