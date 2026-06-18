export interface SearchTrack {
  videoId: string
  title: string
  artist: string
  thumbnail: string
}

interface SearchResponse {
  items: SearchTrack[]
}

export async function searchYoutube(query: string): Promise<SearchTrack[]> {
  const q = query.trim()
  if (!q) return []

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '검색 실패')
  }

  const data: SearchResponse = await res.json()
  return (data.items || []).filter((item) => item.videoId)
}
