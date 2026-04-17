import { apiClient } from './client'
import type {
  QRPublicData,
  OwnProfile,
  SendOtpResponse,
  VerifyOtpResponse,
  SendMessageResponse,
} from '@/types/api'
import type { ApiResponse } from '@/types/api'

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem('access_token', token)
}

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function clearToken() {
  localStorage.removeItem('access_token')
}

// ─── QR endpoints ─────────────────────────────────────────────────────────────

export function getQRData(qrId: string): Promise<ApiResponse<QRPublicData>> {
  return apiClient.get(`/qr/${qrId}`)
}

export function sendOtp(qrId: string, phone: string): Promise<ApiResponse<SendOtpResponse>> {
  return apiClient.post(`/qr/${qrId}`, { phone })
}

export function verifyOtp(
  qrId: string,
  phone: string,
  otp: string
): Promise<ApiResponse<VerifyOtpResponse>> {
  return apiClient.post(`/qr-verify/${qrId}`, { phone, otp })
}

export function sendMessage(
  qrId: string,
  message: string,
  mediaUrl?: string | null
): Promise<ApiResponse<SendMessageResponse>> {
  return apiClient.post(`/qr-message/${qrId}`, { message, media_url: mediaUrl ?? undefined })
}

export function uploadMedia(file: File): Promise<ApiResponse<{ url: string }>> {
  return apiClient.uploadFile('/upload', file)
}

// ─── Profile endpoints ────────────────────────────────────────────────────────

export function getMyProfile(): Promise<ApiResponse<OwnProfile>> {
  return apiClient.get('/me')
}

export function updateMyProfile(data: Partial<OwnProfile>): Promise<ApiResponse<OwnProfile>> {
  return apiClient.patch('/me', data)
}

export function updateVehicle(
  vehicleId: string,
  data: { plate_number?: string; car_model?: string; photo_url?: string; telegram_enabled?: boolean }
): Promise<ApiResponse<unknown>> {
  return apiClient.patch(`/me/vehicles/${vehicleId}`, data)
}

// ─── Compat helpers ───────────────────────────────────────────────────────────

export function isUserRegistered(): boolean {
  return !!localStorage.getItem('access_token')
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export function adminLogin(
  username: string,
  password: string
): Promise<ApiResponse<{ tokens: { access_token: string }; admin_session: boolean }>> {
  return apiClient.post('/admin/login', { username, password })
}

export function adminGetDashboard(
  days = 30
): Promise<ApiResponse<import('@/types/api').DashboardStats>> {
  return apiClient.get(`/admin/dashboard?days=${days}`, true)
}

export function adminGetUsers(
  page = 1,
  limit = 50
): Promise<ApiResponse<{ data: import('@/types/api').AdminClient[]; total: number; page: number; limit: number }>> {
  return apiClient.get(`/admin/users?page=${page}&limit=${limit}`, true)
}

export function adminGetUserDetail(
  userId: string
): Promise<ApiResponse<import('@/types/api').AdminUserDetail>> {
  return apiClient.get(`/admin/users/${userId}/detail`, true)
}

export function adminUpdateUser(
  userId: string,
  data: { first_name?: string; last_name?: string; phone?: string }
): Promise<ApiResponse<import('@/types/api').AdminClient>> {
  return apiClient.patch(`/admin/users/${userId}`, data, true)
}

export function adminBlockUser(userId: string): Promise<ApiResponse<unknown>> {
  return apiClient.patch(`/admin/users/${userId}/block`, undefined, true)
}

export function adminGetQRCodes(
  status = '',
  page = 1,
  limit = 50
): Promise<ApiResponse<{ data: import('@/types/api').AdminQRCode[]; total: number; page: number; limit: number }>> {
  const q = status ? `&status=${status}` : ''
  return apiClient.get(`/admin/qrcodes?page=${page}&limit=${limit}${q}`, true)
}

export function adminGenerateQR(
  count = 10
): Promise<ApiResponse<{ count: number; data: import('@/types/api').AdminQRCode[] }>> {
  return apiClient.post('/admin/qrcodes/generate', { count }, true)
}

export function adminBlockQR(qrId: string): Promise<ApiResponse<unknown>> {
  return apiClient.patch(`/admin/qrcodes/${qrId}/block`, undefined, true)
}

export function adminGetMessages(
  page = 1,
  limit = 50
): Promise<ApiResponse<{ data: import('@/types/api').AdminMessage[]; total: number; page: number; limit: number }>> {
  return apiClient.get(`/admin/messages?page=${page}&limit=${limit}`, true)
}
