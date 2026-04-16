import type { ApiResponse } from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_URL}/api/v1`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAdminToken = false
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const extraHeaders = options.headers as Record<string, string> | undefined
    if (extraHeaders) {
      Object.assign(headers, extraHeaders)
    }

    const tokenKey = useAdminToken ? 'admin_token' : 'access_token'
    const token = localStorage.getItem(tokenKey)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: data.message || 'Произошла ошибка',
          },
        }
      }

      if ('success' in data) {
        return data as ApiResponse<T>
      }

      return { success: true, data: data as T }
    } catch {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Ошибка соединения. Проверьте интернет',
        },
      }
    }
  }

  async get<T>(endpoint: string, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, useAdminToken)
  }

  async post<T>(endpoint: string, data?: unknown, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, useAdminToken)
  }

  async patch<T>(endpoint: string, data?: unknown, useAdminToken = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, useAdminToken)
  }
}

export const apiClient = new ApiClient()
