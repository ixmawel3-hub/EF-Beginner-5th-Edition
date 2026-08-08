type RegisteredUser = {
  email: string
  role?: 'teacher' | 'student'
  livros?: string[]
}

const FALLBACK_REMOTE_USERS_URL = 'https://ixmawel3-hub.github.io/EnglishBooks/assets/data/efb5e.json'

// Vite environment variables (define in .env or .env.local):
// VITE_GOOGLE_FILE_ID, VITE_GOOGLE_API_KEY and VITE_BOOK_ID
const GOOGLE_FILE_ID = (import.meta.env.VITE_GOOGLE_FILE_ID as string) || ''
const GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_API_KEY as string) || ''
const BOOK_ID = (import.meta.env.VITE_BOOK_ID as string) || ''

const buildGoogleDriveUrl = (fileId?: string, apiKey?: string) => {
  if (!fileId || !apiKey) return null
  // Drive API v3 media endpoint (returns file contents). File must be shared appropriately.
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(apiKey)}`
}

const extractUsersFromData = (data: any): any[] => {
  if (!data) return []
  // Legacy single-book format: { usuarios: [...] }
  if (data.usuarios && Array.isArray(data.usuarios)) return data.usuarios

  // New multi-book formats:
  // 1) top-level keyed by book id: { "efb5e": { usuarios: [...] }, ... }
  if (BOOK_ID && data[BOOK_ID] && Array.isArray(data[BOOK_ID].usuarios)) return data[BOOK_ID].usuarios

  // 2) nested under `books` object: { books: { efb5e: { usuarios: [...] } } }
  if (BOOK_ID && data.books && data.books[BOOK_ID] && Array.isArray(data.books[BOOK_ID].usuarios)) return data.books[BOOK_ID].usuarios

  // 3) if the data itself is an array (legacy list)
  if (Array.isArray(data)) return data

  // 4) try to find any value that contains `usuarios`
  for (const val of Object.values(data)) {
    if (val && typeof val === 'object' && Array.isArray((val as any).usuarios)) return (val as any).usuarios
  }

  return []
}

const loadRemoteUsers = async (): Promise<any[]> => {
  // Prefer Google Drive if both file id and api key are present
  const driveUrl = buildGoogleDriveUrl(GOOGLE_FILE_ID, GOOGLE_API_KEY)
  const url = driveUrl ? `${driveUrl}&_=${Date.now()}` : `${FALLBACK_REMOTE_USERS_URL}?_=${Date.now()}`

  // Try fetching the chosen URL. If Google Drive fails and we attempted it, try the fallback once.
  const res = await fetch(url)
  if (!res.ok) {
    if (driveUrl) {
      // try fallback URL
      const fallbackUrl = `${FALLBACK_REMOTE_USERS_URL}?_=${Date.now()}`
      const fbRes = await fetch(fallbackUrl)
      if (!fbRes.ok) throw new Error('remote fetch failed (google drive and fallback)')
      const data = await fbRes.json()
      return extractUsersFromData(data)
    }
    throw new Error('remote fetch failed')
  }

  const data = await res.json()
  return extractUsersFromData(data)
}

// Returns a RegisteredUser if found. Supports two legacy formats:
// - array of strings (emails) -> treated as students (no explicit role)
// - array of objects { email, role?, livros? }
export const findUserByEmail = async (email: string): Promise<RegisteredUser | undefined> => {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) return undefined

  const users: any[] = await loadRemoteUsers()
  if (!users || users.length === 0) return undefined

  // array of objects
  if (users.length && typeof users[0] === 'object') {
    const u = (users as any[]).find((user) => (user.email || '').toLowerCase() === normalizedEmail)
    return u as RegisteredUser | undefined
  }

  // legacy: array of emails (strings)
  const found = (users as string[]).find((u) => typeof u === 'string' && u.toLowerCase() === normalizedEmail)
  if (found) return { email: found, role: 'student', livros: [] }
  return undefined
}
