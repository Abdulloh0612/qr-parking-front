export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string>
  retry_after?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── QR публичные данные (GET /qr/:qr_id) ────────────────────────────────────

export interface QROwner {
  id: string
  phone: string
  first_name: string
  last_name: string
  avatar_url: string | null
  vehicle_number: string
  vehicle_brand: string
  vehicle_photo_url: string | null
  whatsapp: string | null
  instagram: string | null
  telegram: string | null
  vk: string | null
  facebook: string | null
  telegram_enabled: boolean
  scan_count: number
}

export type QRPublicData =
  | { registered: false }
  | { registered: true; owner: QROwner }

// ─── Личный профиль (GET /me) ─────────────────────────────────────────────────

export interface Vehicle {
  id: string
  plate_number: string
  car_model: string
  photo_url: string | null
  telegram_enabled: boolean
  qr_code: string
}

export interface OwnProfile {
  id: string
  phone: string
  first_name: string
  last_name: string
  avatar_url: string | null
  vehicles: Vehicle[]
  whatsapp: string | null
  instagram: string | null
  telegram: string | null
  vk: string | null
  facebook: string | null
}

// ─── Ответы OTP ───────────────────────────────────────────────────────────────

export interface SendOtpResponse {
  message: string
}

export interface VerifyOtpResponse {
  access_token: string
  user_id: string
  is_new_user: boolean
}

export interface SendMessageResponse {
  message: string
}

// ─── Админка ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  display_id: string
  username: string
  created_at: string
  updated_at: string
}

export interface AdminClient {
  id: number
  display_id: string
  phone: string
  first_name: string
  last_name: string
  is_admin: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AdminQRCode {
  id: number
  code: string
  status: string
  created_at: string
}

export interface AdminMessage {
  id: string
  qr_code_id: string
  vehicle_id: string
  content: string
  sender_name: string | null
  sender_phone: string | null
  is_delivered: boolean
  delivered_at: string | null
  created_at: string
}
