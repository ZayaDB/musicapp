import { getAllTracks } from './db'
import { isAudioCached } from './cache'
import type { CachedTrack } from '../types'

export async function getCachedTracks(): Promise<CachedTrack[]> {
  const all = await getAllTracks()
  const results: CachedTrack[] = []

  for (const track of all) {
    if (await isAudioCached(track.videoId)) {
      results.push(track)
    }
  }

  return results.sort((a, b) => b.cachedAt - a.cachedAt)
}
