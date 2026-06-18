import { saveTrack, getAllTracks } from './db'
import { fetchYoutubeMetadata } from './upload'

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

interface DownloadInfo {
  videoId: string
  mimeType: string
  title?: string
  artist?: string
}

async function getDownloadInfo(videoId: string): Promise<DownloadInfo> {
  const res = await fetch(`/api/download?v=${encodeURIComponent(videoId)}`, {
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '음원 정보를 가져오지 못했습니다')
  }
  return res.json()
}

async function probeContentLength(videoId: string): Promise<number> {
  const res = await fetch(`/api/fetch-audio?v=${encodeURIComponent(videoId)}`, {
    headers: { Range: 'bytes=0-0' },
  })
  if (!res.ok && res.status !== 206) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `다운로드 실패 (${res.status})`)
  }
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    const n = parseInt(total, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

async function downloadChunk(videoId: string, start: number, end: number): Promise<ArrayBuffer> {
  const res = await fetch(`/api/fetch-audio?v=${encodeURIComponent(videoId)}`, {
    headers: { Range: `bytes=${start}-${end}` },
  })
  if (!res.ok && res.status !== 206) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `다운로드 실패 (${res.status})`)
  }
  return res.arrayBuffer()
}

async function downloadToBlob(
  videoId: string,
  mimeType: string,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const total = await probeContentLength(videoId)

  if (total > 0) {
    const parts: BlobPart[] = []
    for (let start = 0; start < total; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, total - 1)
      const buf = await downloadChunk(videoId, start, end)
      parts.push(buf)
      onProgress(Math.min(99, Math.round(((end + 1) / total) * 100)))
    }
    return new Blob(parts, { type: mimeType })
  }

  const parts: BlobPart[] = []
  let start = 0
  for (let i = 0; i < 200; i++) {
    const end = start + CHUNK_SIZE - 1
    const buf = await downloadChunk(videoId, start, end)
    parts.push(buf)
    if (buf.byteLength < CHUNK_SIZE) break
    start += CHUNK_SIZE
    onProgress(Math.min(90, (i + 1) * 5))
  }
  return new Blob(parts, { type: mimeType })
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

const DEFAULT_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#8b5cf6"/><path fill="white" d="M100 55v70a20 20 0 1 0 12 18V75h28V55H100z"/></svg>`,
  )

export async function downloadYoutubeToLibrary(
  youtubeUrl: string,
  onProgress: (stage: string, percent: number) => void,
): Promise<string> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) throw new Error('YouTube URL이 올바르지 않습니다')

  const existing = await findTrackByVideoId(videoId)
  if (existing) return existing.id

  onProgress('음원 준비 중…', 5)
  const info = await getDownloadInfo(videoId)

  onProgress('다운로드 중…', 10)
  const blob = await downloadToBlob(videoId, info.mimeType || 'audio/mp4', (p) =>
    onProgress('다운로드 중…', 10 + p * 0.85),
  )

  onProgress('저장 중…', 98)

  const meta =
    (await fetchYoutubeMetadata(youtubeUrl)) ||
    (info.title
      ? { title: info.title, artist: info.artist || 'Unknown', thumbnail: '' }
      : null)

  const duration = await readBlobDuration(blob)
  const id = crypto.randomUUID()

  await saveTrack({
    id,
    title: meta?.title || `YouTube ${videoId}`,
    artist: meta?.artist || 'Unknown',
    thumbnail: meta?.thumbnail || DEFAULT_THUMB,
    duration,
    fileName: `${videoId}.m4a`,
    addedAt: Date.now(),
    isFavorite: false,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    blob,
  })

  onProgress('완료', 100)
  return id
}
