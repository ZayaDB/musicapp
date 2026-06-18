import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface AudioDB extends DBSchema {
  audioBlobs: {
    key: string
    value: { videoId: string; blob: Blob; savedAt: number }
  }
  streamUrls: {
    key: string
    value: { videoId: string; streamUrl: string; savedAt: number }
  }
}

const MEDIA_CACHE = 'muse-media-v1'
const CHUNK_SIZE = 512 * 1024

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>('muse-audio', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('audioBlobs', { keyPath: 'videoId' })
        }
        if (oldVersion < 2) {
          db.createObjectStore('streamUrls', { keyPath: 'videoId' })
        }
      },
    })
  }
  return dbPromise
}

function proxyUrl(videoId: string): string {
  return `/api/audio?v=${encodeURIComponent(videoId)}`
}

export async function saveStreamUrl(videoId: string, streamUrl: string): Promise<void> {
  const db = await getDB()
  await db.put('streamUrls', { videoId, streamUrl, savedAt: Date.now() })
}

async function getStreamUrl(videoId: string): Promise<string | null> {
  const db = await getDB()
  const entry = await db.get('streamUrls', videoId)
  return entry?.streamUrl ?? null
}

async function isInMediaCache(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(MEDIA_CACHE)
    const res = await cache.match(url)
    return !!res
  } catch {
    return false
  }
}

export async function isAudioCached(videoId: string): Promise<boolean> {
  const db = await getDB()
  const blob = await db.get('audioBlobs', videoId)
  if (blob?.blob?.size) return true

  const streamUrl = await getStreamUrl(videoId)
  if (streamUrl && (await isInMediaCache(streamUrl))) return true

  return false
}

export async function getCachedAudioUrl(videoId: string): Promise<string | null> {
  const db = await getDB()
  const entry = await db.get('audioBlobs', videoId)
  if (entry?.blob?.size) return URL.createObjectURL(entry.blob)

  const streamUrl = await getStreamUrl(videoId)
  if (streamUrl && (await isInMediaCache(streamUrl))) return streamUrl

  return null
}

async function saveBlob(videoId: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('audioBlobs', { videoId, blob, savedAt: Date.now() })
}

export async function cacheAudioViaProxy(videoId: string): Promise<void> {
  if (await isAudioCached(videoId)) return

  const chunks: BlobPart[] = []
  let start = 0

  while (true) {
    const end = start + CHUNK_SIZE - 1
    const res = await fetch(proxyUrl(videoId), {
      headers: { Range: `bytes=${start}-${end}` },
    })

    if (!res.ok) throw new Error('오디오 다운로드 실패')

    const blob = await res.blob()
    if (blob.size === 0) break

    chunks.push(blob)

    if (res.status !== 206) break

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

export async function waitForMediaCache(streamUrl: string, timeoutMs = 120000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isInMediaCache(streamUrl)) return true
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}

export async function removeCachedAudio(videoId: string): Promise<void> {
  const db = await getDB()
  const mapping = await db.get('streamUrls', videoId)
  if (mapping?.streamUrl) {
    try {
      const cache = await caches.open(MEDIA_CACHE)
      await cache.delete(mapping.streamUrl)
    } catch {
      // ignore
    }
  }
  await db.delete('streamUrls', videoId)
  await db.delete('audioBlobs', videoId)
}
