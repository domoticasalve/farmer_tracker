const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('farmer_token')
}

export function clearToken() {
  localStorage.removeItem('farmer_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('No autenticado')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? 'Error en la petición')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)                           => request<T>(path),
  post:   <T>(path: string, body: unknown)            => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)            => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                           => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData, method = 'POST') =>
    request<T>(path, { method, body: form }),
  postForm: <T>(path: string, form: URLSearchParams)  =>
    request<T>(path, { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
}
