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
import { YoutubeEmbed } from '../services/youtubePlayer'
import { cacheAudio, getCachedAudioUrl, isAudioCached } from '../services/cache'
import { saveTrack, getTrack } from '../services/db'

type PlaybackMode = 'audio' | 'youtube'

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
  playbackMode: PlaybackMode
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
  const modeRef = useRef<PlaybackMode>('audio')
  const ytPollRef = useRef<number | null>(null)

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
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('audio')

  const stopYtPoll = useCallback(() => {
    if (ytPollRef.current) {
      window.clearInterval(ytPollRef.current)
      ytPollRef.current = null
    }
  }, [])

  const startYtPoll = useCallback(() => {
    stopYtPoll()
    ytPollRef.current = window.setInterval(async () => {
      const p = await YoutubeEmbed.getPlayer()
      if (!p) return
      const state = p.getPlayerState()
      setCurrentTime(p.getCurrentTime())
      const d = p.getDuration()
      if (d > 0) setDuration(d)
      setIsPlaying(state === YoutubeEmbed.YT_PLAYING)
      if (state === YoutubeEmbed.YT_ENDED) {
        playNextRef.current()
      }
    }, 500)
  }, [stopYtPoll])

  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current
    audio.preload = 'auto'

    const onTimeUpdate = () => {
      if (modeRef.current === 'audio') setCurrentTime(audio.currentTime)
    }
    const onDurationChange = () => {
      if (modeRef.current === 'audio') setDuration(audio.duration || 0)
    }
    const onEnded = () => {
      if (modeRef.current === 'audio') playNextRef.current()
    }
    const onPlay = () => {
      if (modeRef.current === 'audio') setIsPlaying(true)
    }
    const onPause = () => {
      if (modeRef.current === 'audio') setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      stopYtPoll()
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [stopYtPoll])

  const updateMediaSession = useCallback((track: Track) => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }],
    })
  }, [])

  const playNextRef = useRef<() => void>(() => {})

  const playViaYoutube = useCallback(
    async (track: Track) => {
      modeRef.current = 'youtube'
      setPlaybackMode('youtube')
      audioRef.current?.pause()

      await YoutubeEmbed.play(track.videoId)
      startYtPoll()
      updateMediaSession(track)
      setIsCached(false)
      setIsCaching(false)
    },
    [startYtPoll, updateMediaSession],
  )

  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      const audio = audioRef.current
      if (!audio) return

      setError(null)
      setIsLoading(true)
      setCurrentTrack(track)
      currentTrackRef.current = track
      stopYtPoll()

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
        const cached = await isAudioCached(track.videoId)

        if (cached) {
          modeRef.current = 'audio'
          setPlaybackMode('audio')
          const src = await getCachedAudioUrl(track.videoId)
          if (!src) throw new Error('캐시된 오디오를 불러올 수 없습니다')
          setIsCached(true)
          audio.src = src
          updateMediaSession(track)
          await audio.play()
          return
        }

        setIsCached(false)
        const streamUrl = await getAudioStreamUrl(track.videoId)

        if (!streamUrl) {
          await playViaYoutube(track)
          return
        }

        modeRef.current = 'audio'
        setPlaybackMode('audio')
        setIsCaching(true)
        cacheAudio(track.videoId, streamUrl)
          .then(async () => {
            setIsCached(true)
            setIsCaching(false)
            const saved = await getTrack(track.videoId)
            if (saved) await saveTrack({ ...saved, cachedAt: Date.now() })
          })
          .catch(() => setIsCaching(false))

        audio.src = streamUrl
        updateMediaSession(track)
        await audio.play()
      } catch (e) {
        try {
          await playViaYoutube(track)
        } catch (fallbackErr) {
          let msg =
            fallbackErr instanceof Error ? fallbackErr.message : '재생 실패'
          if (e instanceof Error && !msg.includes('YouTube')) {
            msg = e.message
          }
          if (msg.includes('NotAllowedError') || msg.includes('not allowed')) {
            msg = '재생 권한이 필요합니다. 곡을 다시 탭해 주세요.'
          }
          setError(msg)
          setIsPlaying(false)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [playViaYoutube, stopYtPoll, updateMediaSession],
  )

  const playNext = useCallback(() => {
    const q = queueRef.current
    const current = currentTrackRef.current
    if (!current || q.length === 0) return
    const idx = q.findIndex((t) => t.videoId === current.videoId)
    if (idx < q.length - 1) playTrack(q[idx + 1])
  }, [playTrack])

  const playPrev = useCallback(() => {
    if (modeRef.current === 'audio') {
      const audio = audioRef.current
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0
        return
      }
    } else {
      const p = YoutubeEmbed.getPlayer().then((player) => {
        if (player && player.getCurrentTime() > 3) {
          player.seekTo(0, true)
          return true
        }
        return false
      })
      p.then((seeked) => {
        if (seeked) return
        const q = queueRef.current
        const current = currentTrackRef.current
        if (!current || q.length === 0) return
        const idx = q.findIndex((t) => t.videoId === current.videoId)
        if (idx > 0) playTrack(q[idx - 1])
      })
      return
    }
    const q = queueRef.current
    const current = currentTrackRef.current
    if (!current || q.length === 0) return
    const idx = q.findIndex((t) => t.videoId === current.videoId)
    if (idx > 0) playTrack(q[idx - 1])
  }, [playTrack])

  playNextRef.current = playNext

  const togglePlay = useCallback(async () => {
    if (!currentTrack) return

    if (modeRef.current === 'youtube') {
      const p = await YoutubeEmbed.getPlayer()
      if (!p) return
      if (isPlaying) p.pauseVideo()
      else p.playVideo()
      return
    }

    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play().catch(() => setError('재생 실패'))
  }, [currentTrack, isPlaying])

  const seek = useCallback(async (time: number) => {
    if (modeRef.current === 'youtube') {
      const p = await YoutubeEmbed.getPlayer()
      p?.seekTo(time, true)
      setCurrentTime(time)
      return
    }
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
        playbackMode,
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
