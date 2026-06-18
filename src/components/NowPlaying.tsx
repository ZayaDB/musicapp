import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'

export function NowPlaying() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    error,
    showNowPlaying,
    setShowNowPlaying,
    togglePlay,
    playNext,
    playPrev,
    seek,
  } = usePlayer()

  if (!showNowPlaying || !currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1030] via-[#0a0a0f] to-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 pt-safe-top pb-2">
        <button
          type="button"
          onClick={() => setShowNowPlaying(false)}
          className="rounded-full p-2 text-white/60 transition-colors hover:text-white"
          aria-label="닫기"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">재생 중</p>
          <p className="text-[10px] text-emerald-400/80">오프라인 재생</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
        <div className="relative w-full max-w-[320px]">
          <div className="absolute -inset-4 rounded-3xl bg-violet-500/20 blur-3xl" />
          <img
            src={currentTrack.thumbnail}
            alt=""
            className={`relative aspect-square w-full rounded-2xl object-cover shadow-2xl shadow-violet-500/10 ${
              isPlaying ? 'animate-pulse-slow' : ''
            }`}
          />
        </div>

        <div className="w-full max-w-[320px] text-center">
          <h2 className="line-clamp-2 text-xl font-bold text-white">{currentTrack.title}</h2>
          <p className="mt-1 text-base text-white/50">{currentTrack.artist}</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="w-full max-w-[320px]">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-range w-full"
            style={{
              background: `linear-gradient(to right, #8b5cf6 ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
            }}
          />
          <div className="mt-1.5 flex justify-between text-xs text-white/30 tabular-nums">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-10 px-8 pb-safe-bottom pb-12">
        <button
          type="button"
          onClick={playPrev}
          className="text-white/60 transition-colors hover:text-white"
          aria-label="이전"
        >
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/10 transition-transform active:scale-95"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : isPlaying ? (
            <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-7 w-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={playNext}
          className="text-white/60 transition-colors hover:text-white"
          aria-label="다음"
        >
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zm2.5-6v0zm3.5 6h2V6h-2v12z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
