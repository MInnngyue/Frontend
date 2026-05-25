const BACKEND_URL = 'http://localhost:8080'

export function imageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}
