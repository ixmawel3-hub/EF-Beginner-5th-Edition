type RegisteredUser = {
  email: string
  role?: 'teacher' | 'student'
  livros?: string[]
}

const REMOTE_USERS_URL = 'https://ixmawel3-hub.github.io/EnglishBooks/assets/data/efb5e.json'

const loadRemoteUsers = async (): Promise<any[]> => {
  // Always fetch remote resource and add a cache-busting param to avoid CDN/browser cache.
  const url = `${REMOTE_USERS_URL}?_=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('remote fetch failed')
  const data = await res.json()
  return data && data.usuarios ? data.usuarios : (Array.isArray(data) ? data : [])
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
