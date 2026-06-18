export async function getAudioStreamUrl(videoId: string): Promise<string | null> {
  const res = await fetch(`/api/stream?v=${encodeURIComponent(videoId)}`, {
    signal: AbortSignal.timeout(20000),
  })
  const data = await res.json()

  if (res.ok && data.url) {
    return data.url as string
  }

  if (data.fallback === 'youtube') {
    return null
  }

  throw new Error(data.error ?? '스트림을 가져올 수 없습니다')
}
