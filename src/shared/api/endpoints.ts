import { apiClient } from './client'
import type {
  ApiResponse,
  QRPublicData,
  OwnProfile,
  SendOtpResponse,
  VerifyOtpResponse,
  SendMessageResponse,
  DashboardStats,
  DashboardChartSeries,
  DashboardChartData,
  AdminClient,
  AdminUserDetail,
  AdminQRCode,
  AdminMessage,
  AdminSessionInfo,
  AdminAccount,
  AdminRole,
} from '@/shared/types/api'

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveToken(token: string)  { localStorage.setItem('access_token', token) }
export function getToken(): string | null { return localStorage.getItem('access_token') }
export function clearToken()              { localStorage.removeItem('access_token') }

// ─── QR endpoints ─────────────────────────────────────────────────────────────

export const getQRData   = (qrId: string)                          => apiClient.get<QRPublicData>(`/qr/${qrId}`)
export const sendOtp     = (qrId: string, phone: string)           => apiClient.post<SendOtpResponse>(`/qr/${qrId}`, { phone })
export const verifyOtp   = (qrId: string, phone: string, otp: string) => apiClient.post<VerifyOtpResponse>(`/qr-verify/${qrId}`, { phone, otp })
export const sendMessage = (qrId: string, message: string, mediaUrl?: string | null) =>
  apiClient.post<SendMessageResponse>(`/qr-message/${qrId}`, { message, media_url: mediaUrl ?? undefined })
export const uploadMedia = (file: File): Promise<ApiResponse<{ url: string }>> => apiClient.uploadFile('/upload', file)

// ─── Profile endpoints ────────────────────────────────────────────────────────

export const getMyProfile    = ()                             => apiClient.get<OwnProfile>('/me')
export const updateMyProfile = (data: Partial<OwnProfile>)   => apiClient.patch<OwnProfile>('/me', data)
export const updateVehicle   = (vehicleId: string, data: { plate_number?: string; car_model?: string; photo_url?: string; telegram_enabled?: boolean }) =>
  apiClient.patch<unknown>(`/me/vehicles/${vehicleId}`, data)

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export const adminLogin = (username: string, password: string) =>
  apiClient.post<{ tokens: { access_token: string }; admin_session: boolean; role: AdminRole }>('/admin/login', { username, password })

export const adminGetMe        = ()                          => apiClient.get<AdminSessionInfo>('/admin/me', true)
export const adminListAdmins   = (page = 1, limit = 50)      => apiClient.get<{ data: AdminAccount[]; total: number; page: number; limit: number }>(`/admin/admins?page=${page}&limit=${limit}`, true)
export const adminCreateAdmin  = (body: { username: string; password: string; role?: AdminRole }) => apiClient.post<AdminAccount>('/admin/admins', body, true)
export const adminPatchAdmin   = (id: string, body: { password?: string; role?: AdminRole })      => apiClient.patch<AdminAccount>(`/admin/admins/${id}`, body, true)
export const adminBlockAdminAccount = (id: string) => apiClient.patch<unknown>(`/admin/admins/${id}/block`, undefined, true)

export const adminGetDashboard      = (days = 30)              => apiClient.get<DashboardStats>(`/admin/dashboard?days=${days}`, true)
export const adminGetDashboardChart = (days = 30, series: DashboardChartSeries = 'clients') =>
  apiClient.get<DashboardChartData>(`/admin/dashboard/chart?${new URLSearchParams({ days: String(days), series })}`, true)

export const adminGetUsers      = (page = 1, limit = 50)     => apiClient.get<{ data: AdminClient[]; total: number; page: number; limit: number }>(`/admin/users?page=${page}&limit=${limit}`, true)
export const adminGetUserDetail = (userId: string)           => apiClient.get<{ data: AdminUserDetail }>(`/admin/users/${userId}/detail`, true)
export const adminUpdateUser    = (userId: string, data: { first_name?: string; last_name?: string; phone?: string }) => apiClient.patch<AdminClient>(`/admin/users/${userId}`, data, true)
export const adminBlockUser     = (userId: string)           => apiClient.patch<unknown>(`/admin/users/${userId}/block`, undefined, true)

export const adminGetQRCodes = (status = '', page = 1, limit = 50) => {
  const q = status ? `&status=${status}` : ''
  return apiClient.get<{ data: AdminQRCode[]; total: number; page: number; limit: number }>(`/admin/qrcodes?page=${page}&limit=${limit}${q}`, true)
}
export const adminGenerateQR = (count = 10)       => apiClient.post<{ count: number; data: AdminQRCode[] }>('/admin/qrcodes/generate', { count }, true)
export const adminBlockQR    = (qrId: string)     => apiClient.patch<unknown>(`/admin/qrcodes/${qrId}/block`, undefined, true)
export const adminUpdateVehicle = (vehicleId: string, data: { plate_number?: string; car_model?: string; is_public?: boolean }) =>
  apiClient.patch<unknown>(`/admin/vehicles/${vehicleId}`, data, true)

export const adminGetMessages = (page = 1, limit = 50) =>
  apiClient.get<{ data: AdminMessage[]; total: number; page: number; limit: number }>(`/admin/messages?page=${page}&limit=${limit}`, true)
