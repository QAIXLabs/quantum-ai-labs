/** Calls our own /api routes, turning error bodies ({ detail }) into readable messages. */
export async function api<T>(path: string, { method = 'GET', body, timeout = 15_000 }: { method?: string; body?: unknown; timeout?: number } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : `Request failed (HTTP ${response.status})`)
    // A static host without the API answers /api/* with index.html, which is not JSON.
    if (data === null) throw new Error('The API is not available.')
    return data as T
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new Error('The request timed out. Please retry.')
    if (error instanceof TypeError) throw new Error('Network error: the server could not be reached.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}
