import { useCallback, useEffect, useState } from 'react'
import { toggleFavorite, removeTrack } from '../services/db'
import { getCachedTracks } from '../services/library'
import { removeCachedAudio } from '../services/cache'
import { usePlayer } from '../context/PlayerContext'
import { TrackItem } from './TrackItem'
import type { CachedTrack } from '../types'

export function LibraryView() {
  const [tracks, setTracks] = useState<CachedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const { playTrack, currentTrack } = usePlayer()

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getCachedTracks()
    setTracks(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('muse:library-updated', load)
    return () => window.removeEventListener('muse:library-updated', load)
  }, [load, currentTrack])

  async function handleFavorite(videoId: string) {
    await toggleFavorite(videoId)
    load()
  }

  async function handleDelete(videoId: string) {
    await removeCachedAudio(videoId)
    await removeTrack(videoId)
    load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">라이브러리</h1>
        <p className="mt-1 text-sm text-white/40">
          {tracks.length > 0
            ? `${tracks.length}곡 오프라인 저장됨`
            : '재생한 곡이 자동으로 저장됩니다'}
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-sm text-white/40">아직 저장된 곡이 없어요</p>
          <p className="text-xs text-white/25">온라인에서 재생하면 자동 저장됩니다</p>
          <p className="text-xs text-white/25">YouTube 모드로 들은 곡은 저장되지 않습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {tracks.map((track) => (
            <div key={track.videoId} className="group relative">
              <TrackItem
                track={track}
                subtitle={track.artist}
                onClick={() => playTrack(track, tracks)}
                trailing={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleFavorite(track.videoId) }}
                      className="rounded-full p-2 text-white/30 transition-colors hover:text-amber-400"
                      aria-label="즐겨찾기"
                    >
                      <svg
                        className={`h-5 w-5 ${track.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                        fill={track.isFavorite ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(track.videoId) }}
                      className="rounded-full p-2 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                      aria-label="삭제"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
