import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface AudioDB extends DBSchema {
  audioBlobs: {
    key: string
    value: { videoId: string; blob: Blob; savedAt: number }
  }
}

const CHUNK_SIZE = 512 * 1024

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>('muse-audio', 1, {
      upgrade(db) {
        db.createObjectStore('audioBlobs', { keyPath: 'videoId' })
      },
    })
  }
  return dbPromise
}

function proxyUrl(videoId: string): string {
  return `/api/audio?v=${encodeURIComponent(videoId)}`
}

export async function isAudioCached(videoId: string): Promise<boolean> {
  const db = await getDB()
  const entry = await db.get('audioBlobs', videoId)
  return !!entry?.blob && entry.blob.size > 0
}

export async function getCachedAudioUrl(videoId: string): Promise<string | null> {
  const db = await getDB()
  const entry = await db.get('audioBlobs', videoId)
  if (!entry?.blob?.size) return null
  return URL.createObjectURL(entry.blob)
}

async function saveBlob(videoId: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('audioBlobs', { videoId, blob, savedAt: Date.now() })
}

export async function cacheAudio(videoId: string): Promise<void> {
  if (await isAudioCached(videoId)) return

  const chunks: BlobPart[] = []
  let start = 0

  while (true) {
    const end = start + CHUNK_SIZE - 1
    const res = await fetch(proxyUrl(videoId), {
      headers: { Range: `bytes=${start}-${end}` },
    })

    if (!res.ok) {
      throw new Error('오디오 다운로드 실패')
    }

    const blob = await res.blob()
    if (blob.size === 0) break

    chunks.push(blob)

    if (res.status !== 206) {
      break
    }

    const range = res.headers.get('Content-Range')
    if (!range) break

    const match = range.match(/bytes (\d+)-(\d+)\/(\d+)/)
    if (!match) break

    const total = Number(match[3])
    const chunkEnd = Number(match[2])
    if (chunkEnd + 1 >= total) break
    start = chunkEnd + 1
  }

  if (chunks.length === 0) throw new Error('오디오 데이터가 비어 있습니다')
  await saveBlob(videoId, new Blob(chunks, { type: 'audio/mp4' }))
}

export function getProxyAudioUrl(videoId: string): string {
  return proxyUrl(videoId)
}

export async function removeCachedAudio(videoId: string): Promise<void> {
  const db = await getDB()
  await db.delete('audioBlobs', videoId)
}
