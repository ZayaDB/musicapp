import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CachedTrack } from '../types'

interface MuseDB extends DBSchema {
  tracks: {
    key: string
    value: CachedTrack
    indexes: { 'by-cachedAt': number; 'by-favorite': number }
  }
}

let dbPromise: Promise<IDBPDatabase<MuseDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MuseDB>('muse-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('tracks', { keyPath: 'videoId' })
        store.createIndex('by-cachedAt', 'cachedAt')
        store.createIndex('by-favorite', 'isFavorite')
      },
    })
  }
  return dbPromise
}

export async function saveTrack(track: CachedTrack): Promise<void> {
  const db = await getDB()
  await db.put('tracks', track)
}

export async function getTrack(videoId: string): Promise<CachedTrack | undefined> {
  const db = await getDB()
  return db.get('tracks', videoId)
}

export async function getAllTracks(): Promise<CachedTrack[]> {
  const db = await getDB()
  return db.getAllFromIndex('tracks', 'by-cachedAt')
}

export async function getCachedTracks(): Promise<CachedTrack[]> {
  const all = await getAllTracks()
  return all.sort((a, b) => b.cachedAt - a.cachedAt)
}

export async function toggleFavorite(videoId: string): Promise<boolean> {
  const db = await getDB()
  const track = await db.get('tracks', videoId)
  if (!track) return false
  track.isFavorite = !track.isFavorite
  await db.put('tracks', track)
  return track.isFavorite
}

export async function removeTrack(videoId: string): Promise<void> {
  const db = await getDB()
  await db.delete('tracks', videoId)
}
