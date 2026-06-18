import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Track } from '../types'

interface StoredTrack extends Track {
  blob: Blob
}

interface MuseDB extends DBSchema {
  tracks: {
    key: string
    value: StoredTrack
    indexes: { 'by-addedAt': number; 'by-favorite': number }
  }
}

let dbPromise: Promise<IDBPDatabase<MuseDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MuseDB>('muse-local', 1, {
      upgrade(db) {
        const store = db.createObjectStore('tracks', { keyPath: 'id' })
        store.createIndex('by-addedAt', 'addedAt')
        store.createIndex('by-favorite', 'isFavorite')
      },
    })
  }
  return dbPromise
}

export async function saveTrack(track: StoredTrack): Promise<void> {
  const db = await getDB()
  await db.put('tracks', track)
}

export async function getTrack(id: string): Promise<StoredTrack | undefined> {
  const db = await getDB()
  return db.get('tracks', id)
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('tracks', 'by-addedAt')
  return all
    .map(({ blob: _, ...track }) => track)
    .sort((a, b) => b.addedAt - a.addedAt)
}

export async function getTrackBlobUrl(id: string): Promise<string | null> {
  const track = await getTrack(id)
  if (!track?.blob?.size) return null
  return URL.createObjectURL(track.blob)
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDB()
  const track = await db.get('tracks', id)
  if (!track) return false
  track.isFavorite = !track.isFavorite
  await db.put('tracks', track)
  return track.isFavorite
}

export async function removeTrack(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tracks', id)
}

export async function searchTracks(query: string): Promise<Track[]> {
  const all = await getAllTracks()
  const q = query.toLowerCase().trim()
  if (!q) return all
  return all.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.fileName.toLowerCase().includes(q),
  )
}

export type { StoredTrack }
