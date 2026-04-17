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
  telegram_bot_linked: boolean
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
  vehicle_count?: number
}

export interface AdminVehicle {
  id: number
  display_id: string
  user_id: string
  plate_number: string
  car_model: string
  is_public: boolean
  photo_url: string | null
  reviews_enabled: boolean
  telegram_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdminQRCode {
  id: number
  code: string
  vehicle_id: string | null
  status: 'unregistered' | 'active' | 'blocked'
  created_by: string | null
  registered_at: string | null
  created_at: string
}

export interface AdminMessage {
  id: string
  qr_code_id: string
  vehicle_id: string
  content: string
  media_url: string | null
  sender_name: string | null
  sender_phone: string | null
  is_delivered: boolean
  delivered_at: string | null
  created_at: string
}

export interface AdminUserDetail extends AdminClient {
  vehicles: AdminVehicle[]
  messages: AdminMessage[]
  qr_codes: AdminQRCode[]
  vehicle_count: number
}

export interface DashboardGrowthPoint {
  date: string
  count: number
}

export interface DashboardStats {
  total_users: number
  total_qr_codes: number
  active_qr: number
  unregistered_qr: number
  blocked_qr: number
  total_messages: number
  scans_today: number
  user_growth: DashboardGrowthPoint[]
}
