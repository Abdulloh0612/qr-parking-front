import type { ApiResponse } from '@/shared/types/api'

function apiBasePath(): string {
  const raw = String(import.meta.env.VITE_API_URL ?? '').trim()
  if (raw === '' || raw === '/') return '/api/v1'
  return `${raw.replace(/\/$/, '')}/api/v1`
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = apiBasePath()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAdminToken = false,
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    const extra = options.headers as Record<string, string> | undefined
    if (extra) Object.assign(headers, extra)

    const token = localStorage.getItem(useAdminToken ? 'admin_token' : 'access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && useAdminToken) {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_role')
          return { success: false, error: { code: 'AUTH_EXPIRED' as const, message: 'Сессия истекла' } }
        }
        const rawErr = data.error
        const normalized =
          typeof rawErr === 'string'
            ? { code: 'API_ERROR' as const, message: rawErr }
            : rawErr || { code: 'UNKNOWN_ERROR' as const, message: data.message || 'Произошла ошибка' }
        return { success: false, error: normalized }
      }

      if ('success' in data) return data as ApiResponse<T>
      return { success: true, data: data as T }
    } catch {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Ошибка соединения. Проверьте интернет' } }
    }
  }

  get<T>(endpoint: string, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, useAdminToken)
  }

  post<T>(endpoint: string, data?: unknown, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }, useAdminToken)
  }

  patch<T>(endpoint: string, data?: unknown, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }, useAdminToken)
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    const headers: Record<string, string> = {}
    const token = localStorage.getItem('access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', headers, body: formData })
      const data = await response.json()
      if (!response.ok) return { success: false, error: data.error || { code: 'UPLOAD_ERROR', message: data.message || 'Ошибка загрузки' } }
      if ('success' in data) return data as ApiResponse<T>
      return { success: true, data: data as T }
    } catch {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Ошибка соединения' } }
    }
  }
}

export const apiClient = new ApiClient()
