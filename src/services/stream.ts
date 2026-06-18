export async function fetchStreamUrl(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/stream?v=${encodeURIComponent(videoId)}`, {
      signal: AbortSignal.timeout(20000),
    })
    const data = await res.json()
    if (res.ok && data.url) return data.url as string
    return null
  } catch {
    return null
  }
}
