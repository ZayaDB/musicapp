import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Track } from '../types'
import { getAudioStreamUrl } from '../services/stream'
import { cacheAudio, getCachedAudioUrl, isAudioCached } from '../services/cache'
import { saveTrack, getTrack } from '../services/db'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  isCached: boolean
  isCaching: boolean
  error: string | null
  showNowPlaying: boolean
}

interface PlayerActions {
  playTrack: (track: Track, queue?: Track[]) => Promise<void>
  togglePlay: () => void
  playNext: () => void
  playPrev: () => void
  seek: (time: number) => void
  setShowNowPlaying: (show: boolean) => void
}

type PlayerContextValue = PlayerState & PlayerActions

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Track[]>([])
  const currentTrackRef = useRef<Track | null>(null)

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isCached, setIsCached] = useState(false)
  const [isCaching, setIsCaching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNowPlaying, setShowNowPlaying] = useState(false)

  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => playNextRef.current()
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  const updateMediaSession = useCallback((track: Track) => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: [
        { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    })
  }, [])

  const playNextRef = useRef<() => void>(() => {})

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const audio = audioRef.current
    if (!audio) return

    setError(null)
    setIsLoading(true)
    setCurrentTrack(track)
    currentTrackRef.current = track

    if (newQueue) {
      setQueue(newQueue)
      queueRef.current = newQueue
    }

    const existing = await getTrack(track.videoId)
    await saveTrack({
      ...track,
      cachedAt: existing?.cachedAt ?? Date.now(),
      isFavorite: existing?.isFavorite ?? false,
    })

    try {
      let src: string | null = null
      const cached = await isAudioCached(track.videoId)

      if (cached) {
        src = await getCachedAudioUrl(track.videoId)
        setIsCached(true)
      } else {
        setIsCached(false)
        const streamUrl = await getAudioStreamUrl(track.videoId)
        src = streamUrl

        setIsCaching(true)
        cacheAudio(track.videoId, streamUrl)
          .then(async () => {
            setIsCached(true)
            setIsCaching(false)
            const saved = await getTrack(track.videoId)
            if (saved) {
              await saveTrack({ ...saved, cachedAt: Date.now() })
            }
          })
          .catch(() => setIsCaching(false))
      }

      if (!src) throw new Error('재생 URL을 가져올 수 없습니다')

      audio.src = src
      updateMediaSession(track)
      await audio.play()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '재생 실패'
      setError(msg)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [updateMediaSession])

  const playNext = useCallback(() => {
    const q = queueRef.current
    const current = currentTrackRef.current
    if (!current || q.length === 0) return
    const idx = q.findIndex((t) => t.videoId === current.videoId)
    if (idx < q.length - 1) {
      playTrack(q[idx + 1])
    }
  }, [playTrack])

  const playPrev = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const q = queueRef.current
    const current = currentTrackRef.current
    if (!current || q.length === 0) return
    const idx = q.findIndex((t) => t.videoId === current.videoId)
    if (idx > 0) {
      playTrack(q[idx - 1])
    }
  }, [playTrack])

  playNextRef.current = playNext

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setError('재생 실패'))
    }
  }, [currentTrack, isPlaying])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('play', () => togglePlay())
    navigator.mediaSession.setActionHandler('pause', () => togglePlay())
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
  }, [togglePlay, playPrev, playNext])

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        isCached,
        isCaching,
        error,
        showNowPlaying,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
        seek,
        setShowNowPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
