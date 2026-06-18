export interface Track {
  videoId: string
  title: string
  artist: string
  thumbnail: string
  duration: number
}

export interface CachedTrack extends Track {
  cachedAt: number
  isFavorite: boolean
}

export type Tab = 'search' | 'library'
