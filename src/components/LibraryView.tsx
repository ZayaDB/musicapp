import { useCallback, useEffect, useState } from 'react'
import type { Track } from '../types'
import { getAllTracks, removeTrack, searchTracks, toggleFavorite } from '../services/db'
import { usePlayer } from '../context/PlayerContext'
import { TrackItem } from './TrackItem'

export function LibraryView() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const { playTrack, currentTrack } = usePlayer()

  const load = useCallback(async () => {
    const list = query ? await searchTracks(query) : await getAllTracks()
    setTracks(filter === 'favorites' ? list.filter((t) => t.isFavorite) : list)
  }, [query, filter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const handlePlay = (track: Track) => {
    playTrack(track, tracks)
  }

  const handleFavorite = async (id: string) => {
    await toggleFavorite(id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 곡을 삭제할까요?')) return
    await removeTrack(id)
    load()
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="라이브러리 검색"
          className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/30"
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'favorites'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              filter === f ? 'bg-white text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {f === 'all' ? '전체' : '즐겨찾기'}
          </button>
        ))}
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg className="h-8 w-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <p className="text-white/50">아직 저장된 곡이 없습니다</p>
          <p className="text-sm text-white/35">「다운로드」 탭에서 YouTube URL을 받아 보세요</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              onPlay={() => handlePlay(track)}
              onFavorite={() => handleFavorite(track.id)}
              onDelete={() => handleDelete(track.id)}
              showOfflineBadge
            />
          ))}
        </ul>
      )}
    </div>
  )
}
