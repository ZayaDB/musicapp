async function getAudioUrl(videoId) {
  const { Innertube, ClientType } = await import('youtubei.js')
  const yt = await Innertube.create({
    client_type: ClientType.IOS,
    retrieve_player: false,
  })
  const info = await yt.getBasicInfo(videoId)
  const format = info.chooseFormat({ type: 'audio', quality: 'best' })
  return format?.url ?? null
}

module.exports = { getAudioUrl }
