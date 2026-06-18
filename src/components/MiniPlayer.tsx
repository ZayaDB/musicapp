import { usePlayer } from '../context/PlayerContext'

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    togglePlay,
    setShowNowPlaying,
  } = usePlayer()

  if (!currentTrack) return null

  return (
    <button
      type="button"
      onClick={() => setShowNowPlaying(true)}
      className="flex w-full items-center gap-3 border-t border-white/5 bg-[#12121a]/95 px-4 py-2.5 backdrop-blur-xl"
    >
      <img
        src={currentTrack.thumbnail}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-white">{currentTrack.title}</p>
        <p className="truncate text-xs text-white/40">{currentTrack.artist}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black"
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : isPlaying ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </button>
  )
}
