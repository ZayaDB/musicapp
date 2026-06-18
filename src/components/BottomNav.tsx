interface BottomNavProps {
  active: 'search' | 'library'
  onChange: (tab: 'search' | 'library') => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onChange('search')}
        className={`flex flex-1 flex-col items-center gap-1 py-2.5 pt-3 transition-colors ${
          active === 'search' ? 'text-violet-400' : 'text-white/30'
        }`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active === 'search' ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[10px] font-medium">검색</span>
      </button>
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
    </nav>
  )
}
