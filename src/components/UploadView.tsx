import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadYoutubeToLibrary, findTrackByVideoId, extractVideoId } from '../services/download'
import { importAudioFile } from '../services/upload'
import { YoutubePreview } from './YoutubePreview'

export function UploadView({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [stage, setStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const videoId = useMemo(() => extractVideoId(youtubeUrl), [youtubeUrl])

  const handleDownload = async () => {
    if (!videoId) {
      setMessage('YouTube URL을 붙여넣어 주세요')
      setStatus('error')
      return
    }

    const existing = await findTrackByVideoId(videoId)
    if (existing) {
      setMessage('이미 라이브러리에 있는 곡입니다')
      setStatus('done')
      onUploaded?.()
      return
    }

    setStatus('working')
    setMessage('')
    setProgress(0)

    try {
      await downloadYoutubeToLibrary(youtubeUrl, (s, p) => {
        setStage(s)
        setProgress(p)
      })
      setStatus('done')
      setMessage('다운로드 완료! 라이브러리에서 오프라인 재생할 수 있습니다.')
      setYoutubeUrl('')
      onUploaded?.()
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : '다운로드 실패')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const onPick = useCallback((picked: FileList | null) => {
    if (!picked?.length) return
    const audio = Array.from(picked).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac|ogg)$/i.test(f.name),
    )
    if (!audio.length) {
      setMessage('오디오 파일만 선택할 수 있습니다')
      return
    }
    setFiles(audio)
    setMessage('')
  }, [])

  const handleFileUpload = async () => {
    if (!files.length) return
    setStatus('working')
    setStage('저장 중…')
    try {
      for (const file of files) {
        await importAudioFile(file, { youtubeUrl: youtubeUrl || undefined })
      }
      setStatus('done')
      setMessage(`${files.length}곡 저장 완료`)
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
      onUploaded?.()
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const working = status === 'working'

  return (
    <div className="space-y-5 pb-24">
      <section>
        <h2 className="text-xl font-bold">YouTube 다운로드</h2>
        <p className="mt-1 text-sm text-white/50">
          URL 붙여넣으면 앱 안에서 미리 듣고, 다운로드하면 이 기기에 저장됩니다.
        </p>
      </section>

      <div className="space-y-3">
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          disabled={working}
          className="w-full rounded-2xl bg-white/10 px-4 py-4 text-sm outline-none placeholder:text-white/30 disabled:opacity-50"
        />

        {videoId && !working && <YoutubePreview videoId={videoId} />}

        <button
          type="button"
          disabled={working || !videoId}
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 font-semibold disabled:opacity-40"
        >
          {working ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {stage || '처리 중…'}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              이 곡 다운로드 (오프라인 저장)
            </>
          )}
        </button>

        {working && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-white/40">{Math.round(progress)}%</p>
          </div>
        )}
      </div>

      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {message}
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs text-white/35">
          다운로드는 서버를 거칩니다. YouTube가 막으면 아래에서 MP3 파일을 직접 올려 주세요.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowFileUpload((v) => !v)}
        className="text-sm text-white/40 underline"
      >
        {showFileUpload ? '파일 업로드 닫기' : 'MP3 파일 직접 올리기'}
      </button>

      {showFileUpload && (
        <div className="space-y-3 rounded-2xl bg-white/5 p-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-white/20 py-8 text-sm text-white/60"
          >
            {files.length ? `${files.length}개 선택됨` : '파일 선택'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.m4a"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <button
            type="button"
            disabled={!files.length || working}
            onClick={handleFileUpload}
            className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium disabled:opacity-40"
          >
            라이브러리에 저장
          </button>
        </div>
      )}
    </div>
  )
}
