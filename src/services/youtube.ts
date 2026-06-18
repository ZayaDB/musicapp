import type { Track } from '../types'

async function apiFetch(path: string): Promise<Response> {
  return fetch(path, { signal: AbortSignal.timeout(15000) })
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? '검색에 실패했습니다')
  }

  return (data.items ?? []) as Track[]
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const res = await apiFetch(`/api/stream?v=${encodeURIComponent(videoId)}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? '스트림을 가져올 수 없습니다')
  }

  return data.url
}
