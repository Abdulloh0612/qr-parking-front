import { apiClient } from './client'
import type {
  User,
  RegisterUserData,
  UpdateUserData,
  ContactInfo,
  Message,
  Review,
  SendMessageData,
  CreateReviewData,
} from '@/types/user'
import type { ApiResponse } from '@/types/api'
import { getDeviceId } from '@/lib/utils/deviceId'

// ============= QR Endpoints =============

export async function checkQRStatus(
  qrId: string
): Promise<ApiResponse<{ registered: boolean }>> {
  return apiClient.get(`/qr/${qrId}/status`)
}

export async function registerQR(
  data: RegisterUserData
): Promise<ApiResponse<{ id: string; qr_id: string; created_at: string }>> {
  return apiClient.post('/qr/register', data)
}

export async function getQRInfo(qrId: string): Promise<ApiResponse<ContactInfo>> {
  return apiClient.get(`/qr/${qrId}`)
}

// Get public profile by user display_id (used for /account?id=UUID scheme)
export async function getPublicProfile(
  displayId: string
): Promise<ApiResponse<ContactInfo>> {
  return apiClient.get(`/account/public/${displayId}`)
}

export async function sendMessage(
  qrId: string,
  data: SendMessageData
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post(`/qr/${qrId}/message`, data)
}

export async function createReview(
  qrId: string,
  data: CreateReviewData
): Promise<ApiResponse<{ id: string; rating: number; created_at: string }>> {
  return apiClient.post(`/qr/${qrId}/rating`, data)
}

// ============= Account Endpoints =============

export async function getAccount(): Promise<ApiResponse<User>> {
  return apiClient.get('/account')
}

export async function getAccountMessages(): Promise<ApiResponse<Message[]>> {
  return apiClient.get('/account/messages')
}

export async function getAccountReviews(): Promise<ApiResponse<Review[]>> {
  return apiClient.get('/account/reviews')
}

export async function updateAccount(
  data: UpdateUserData
): Promise<ApiResponse<{ id: string; updated_at: string }>> {
  return apiClient.patch('/account', data)
}

// ============= Device ID helper =============

export function isUserRegistered(): boolean {
  return !!getDeviceId()
}
