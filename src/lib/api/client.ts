import type { ApiResponse } from '@/types/api'
import { getDeviceId } from '@/lib/utils/deviceId'

const API_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_URL}/api/v1`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-ID': getDeviceId(),
    }

    // Merge extra headers
    const extraHeaders = options.headers as Record<string, string> | undefined
    if (extraHeaders) {
      Object.assign(headers, extraHeaders)
    }

    // Add auth token if available
    const token = localStorage.getItem('access_token')
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
            message: 'Произошла ошибка',
          },
        }
      }

      // Backend wraps data in { success: true, data: ... }
      // or returns directly for some endpoints
      if ('success' in data) {
        return data as ApiResponse<T>
      }

      // Wrap raw response
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

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
