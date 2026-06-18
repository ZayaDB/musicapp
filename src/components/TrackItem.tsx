import type { Track } from '../types'
import { formatDuration } from '../utils/format'

interface TrackItemProps {
  track: Track
  isActive?: boolean
  onPlay: () => void
  onFavorite?: () => void
  onDelete?: () => void
  showOfflineBadge?: boolean
}

export function TrackItem({
  track,
  isActive,
  onPlay,
  onFavorite,
  onDelete,
  showOfflineBadge,
}: TrackItemProps) {
  return (
    <li
      className={`flex items-center gap-2 rounded-2xl p-1 transition-colors ${
        isActive ? 'bg-violet-500/15' : 'active:bg-white/5'
      }`}
    >
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 p-1.5 text-left">
        <img
          src={track.thumbnail}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl object-cover bg-white/5"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-white">{track.title}</p>
          <p className="truncate text-sm text-white/50">{track.artist}</p>
          {showOfflineBadge && (
            <span className="text-[10px] text-emerald-400/80">오프라인 재생 가능</span>
          )}
        </div>
        <span className="shrink-0 text-xs text-white/30 tabular-nums">
          {formatDuration(track.duration)}
        </span>
      </button>
      {onFavorite && (
        <button
          type="button"
          onClick={onFavorite}
          className="shrink-0 p-2 text-white/40"
          aria-label="즐겨찾기"
        >
          <svg
            className={`h-5 w-5 ${track.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
            fill={track.isFavorite ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 p-2 text-white/30"
          aria-label="삭제"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </li>
  )
}
