import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface OutboxEntry {
  id: string
  to: string
  payload: {
    ciphertext: string
    iv: string
    encryptedKey: string
    encryptedKeyForSelf: string
  }
  createdAt: number
}

interface WhisperBoxDB extends DBSchema {
  outbox: {
    key: string
    value: OutboxEntry
    indexes: { 'by-created': number }
  }
}

const DB_NAME = 'whisperbox'
const VERSION = 1

let dbPromise: Promise<IDBPDatabase<WhisperBoxDB> | null> | null = null

export async function getDb(): Promise<IDBPDatabase<WhisperBoxDB> | null> {
  if (typeof indexedDB === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<WhisperBoxDB>(DB_NAME, VERSION, {
      upgrade(database) {
        const store = database.createObjectStore('outbox', { keyPath: 'id' })
        store.createIndex('by-created', 'createdAt')
      },
    })
      .then((db) => db)
      .catch(() => null)
  }
  return dbPromise
}

export async function enqueueOutbox(entry: OutboxEntry): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.put('outbox', entry)
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const db = await getDb()
  if (!db) return []
  return db.getAllFromIndex('outbox', 'by-created')
}

export async function removeOutbox(id: string): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.delete('outbox', id)
}
