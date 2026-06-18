import type { Tab } from '../types'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onChange('library')}
        className={`flex flex-1 flex-col items-center gap-1 py-2.5 pt-3 transition-colors ${
          active === 'library' ? 'text-violet-400' : 'text-white/30'
        }`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active === 'library' ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-[10px] font-medium">라이브러리</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('download')}
        className={`flex flex-1 flex-col items-center gap-1 py-2.5 pt-3 transition-colors ${
          active === 'download' ? 'text-violet-400' : 'text-white/30'
        }`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active === 'download' ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-[10px] font-medium">다운로드</span>
      </button>
    </nav>
  )
}
