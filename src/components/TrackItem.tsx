import type { Track } from '../types'
import { formatDuration } from '../utils/format'

interface TrackItemProps {
  track: Track
  subtitle?: string
  onClick: () => void
  trailing?: React.ReactNode
}

export function TrackItem({ track, subtitle, onClick, trailing }: TrackItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors active:bg-white/5"
    >
      <img
        src={track.thumbnail}
        alt=""
        className="h-14 w-14 shrink-0 rounded-xl object-cover bg-white/5"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-white">{track.title}</p>
        <p className="truncate text-sm text-white/50">
          {subtitle ?? track.artist}
        </p>
      </div>
      {trailing ?? (
        <span className="shrink-0 text-xs text-white/30 tabular-nums">
          {formatDuration(track.duration)}
        </span>
      )}
    </button>
  )
}
