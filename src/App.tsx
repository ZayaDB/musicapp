import { useState } from 'react'
import { PlayerProvider } from './context/PlayerContext'
import { LibraryView } from './components/LibraryView'
import { UploadView } from './components/UploadView'
import { BottomNav } from './components/BottomNav'
import { MiniPlayer } from './components/MiniPlayer'
import { NowPlaying } from './components/NowPlaying'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import type { Tab } from './types'

function AppContent() {
  const [tab, setTab] = useState<Tab>('download')
  const [libraryKey, setLibraryKey] = useState(0)
  const online = useOnlineStatus()

  return (
    <div className="flex h-dvh flex-col bg-[#0a0a0f] text-white">
      <header className="flex items-center justify-between px-5 pt-safe-top pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">Muse</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          <span className="text-xs text-white/40">{online ? '온라인' : '오프라인'}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'library' ? (
          <LibraryView key={libraryKey} />
        ) : tab === 'download' ? (
          <UploadView
            onUploaded={() => {
              setLibraryKey((k) => k + 1)
              setTab('library')
            }}
          />
        ) : null}
      </main>

      <div className="shrink-0 pb-safe-bottom">
        <MiniPlayer />
        <BottomNav active={tab} onChange={setTab} />
      </div>

      <NowPlaying />
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  )
}
