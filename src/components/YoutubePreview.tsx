interface YoutubePreviewProps {
  videoId: string
}

export function YoutubePreview({ videoId }: YoutubePreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          title="YouTube 미리듣기"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="px-3 py-2 text-xs text-white/40">
        앱 안에서 미리 듣기 (온라인). 다운로드하면 오프라인으로 저장됩니다.
      </p>
    </div>
  )
}
