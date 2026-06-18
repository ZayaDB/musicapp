interface PipedInstance {
  api_url: string
  uptime_24h?: number
}

interface PipedStream {
  audioStreams?: Array<{ url?: string; bitrate?: number }>
}

async function fetchFromPiped(apiUrl: string, videoId: string): Promise<string | null> {
  const base = apiUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/streams/${videoId}`, {
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) return null
  const data: PipedStream = await res.json()
  const audio = (data.audioStreams ?? [])
    .filter((s) => s.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
  return audio?.url ?? null
}

interface InvidiousVideo {
  adaptiveFormats?: Array<{ type?: string; url?: string; bitrate?: number }>
}

function pickAudioFromInvidious(data: InvidiousVideo) {
  const audio = (data.adaptiveFormats ?? [])
    .filter((f) => f.type?.includes('audio') && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
  return audio?.url ?? null
}

async function fetchFromInvidiousInstance(host: string, videoId: string): Promise<string | null> {
  const res = await fetch(`https://${host}/api/v1/videos/${videoId}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null
  const data: InvidiousVideo = await res.json()
  return pickAudioFromInvidious(data)
}

export async function fetchStreamUrlFromClient(videoId: string): Promise<string | null> {
  try {
    const pipedRes = await fetch('https://piped-instances.kavin.rocks/', {
      signal: AbortSignal.timeout(8000),
    })
    if (pipedRes.ok) {
      const instances: PipedInstance[] = await pipedRes.json()
      const sorted = instances
        .filter((i) => i.api_url && (i.uptime_24h ?? 0) > 90)
        .slice(0, 8)

      for (const instance of sorted) {
        try {
          const url = await fetchFromPiped(instance.api_url, videoId)
          if (url) return url
        } catch {
          // try next
        }
      }
    }
  } catch {
    // fall through
  }

  try {
    const listRes = await fetch('https://api.invidious.io/instances.json', {
      signal: AbortSignal.timeout(8000),
    })
    if (listRes.ok) {
      const instances: [string, { cors?: boolean }][] = await listRes.json()
      const hosts = instances.filter(([, info]) => info.cors).map(([name]) => name)

      for (const host of hosts) {
        try {
          const url = await fetchFromInvidiousInstance(host, videoId)
          if (url) return url
        } catch {
          // try next
        }
      }
    }
  } catch {
    // fall through
  }

  const fallbackHosts = ['invidious.ducks.party', 'inv.nadeko.net', 'yewtu.be']
  for (const host of fallbackHosts) {
    try {
      const url = await fetchFromInvidiousInstance(host, videoId)
      if (url) return url
    } catch {
      // try next
    }
  }

  return null
}
