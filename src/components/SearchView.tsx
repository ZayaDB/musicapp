import { useState } from 'react'
import { searchTracks } from '../services/piped'
import { usePlayer } from '../context/PlayerContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { TrackItem } from './TrackItem'
import type { Track } from '../types'

export function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { playTrack } = usePlayer()
  const online = useOnlineStatus()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !online) return

    setLoading(true)
    setSearched(true)
    try {
      const tracks = await searchTracks(query.trim())
      setResults(tracks)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">검색</h1>
        <p className="mt-1 text-sm text-white/40">곡, 아티스트를 검색하세요</p>
      </div>

      {!online && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          오프라인입니다. 저장된 곡은 라이브러리에서 들을 수 있어요.
        </div>
      )}

      <form onSubmit={handleSearch}>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="무엇을 들을까요?"
            disabled={!online}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-40"
          />
        </div>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="py-12 text-center text-sm text-white/40">검색 결과가 없습니다</p>
      )}

      <div className="flex flex-col gap-0.5">
        {results.map((track) => (
          <TrackItem
            key={track.videoId}
            track={track}
            onClick={() => playTrack(track, results)}
          />
        ))}
      </div>
    </div>
  )
}
