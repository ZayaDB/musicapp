const CACHE_NAME = 'muse-audio-v1'

async function getCache(): Promise<Cache> {
  return caches.open(CACHE_NAME)
}

function cacheKey(videoId: string): string {
  return `audio-${videoId}`
}

export async function isAudioCached(videoId: string): Promise<boolean> {
  const cache = await getCache()
  const res = await cache.match(cacheKey(videoId))
  return !!res
}

export async function getCachedAudioUrl(videoId: string): Promise<string | null> {
  const cache = await getCache()
  const res = await cache.match(cacheKey(videoId))
  if (!res) return null
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function cacheAudio(videoId: string, streamUrl: string): Promise<void> {
  const already = await isAudioCached(videoId)
  if (already) return

  let res: Response
  try {
    res = await fetch(streamUrl)
    if (!res.ok) throw new Error('CORS fetch failed')
  } catch {
    res = await fetch(streamUrl, { mode: 'no-cors' })
  }

  const cache = await getCache()
  await cache.put(cacheKey(videoId), res.clone())
}

export async function removeCachedAudio(videoId: string): Promise<void> {
  const cache = await getCache()
  await cache.delete(cacheKey(videoId))
}
