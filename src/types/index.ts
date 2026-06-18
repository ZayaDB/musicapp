export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  fileName: string
  addedAt: number
  isFavorite: boolean
  youtubeUrl?: string
}

export type Tab = 'library' | 'download'
