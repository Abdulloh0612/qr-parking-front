export interface User {
  id: string          // display_id (UUID, safe for external use)
  display_id: string  // alias
  qr_id: string
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
  whatsapp?: string
  instagram?: string
  telegram?: string
  vk?: string
  facebook?: string
  photo_url?: string
  avatar_url?: string
  reviews_enabled?: boolean
  telegram_enabled: boolean
  average_rating?: number
  total_reviews?: number
  scan_count: number
  created_at: string
  is_owner: boolean
}

export interface RegisterUserData {
  qr_id: string
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
  whatsapp?: string
  instagram?: string
  telegram?: string
  vk?: string
  facebook?: string
  photo_url?: string
  avatar_url?: string
  telegram_enabled?: boolean
  device_id: string
}

export interface UpdateUserData {
  phone?: string
  first_name?: string
  last_name?: string
  vehicle_number?: string
  vehicle_brand?: string
  whatsapp?: string
  instagram?: string
  telegram?: string
  vk?: string
  facebook?: string
  photo_url?: string
  avatar_url?: string
  telegram_enabled?: boolean
}

export interface ContactInfo {
  id: string
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
  whatsapp?: string
  instagram?: string
  telegram?: string
  vk?: string
  facebook?: string
  photo_url?: string
  avatar_url?: string
  reviews_enabled: boolean
  telegram_enabled: boolean
  average_rating: number
  total_reviews: number
  scan_count: number
  is_owner: boolean
}

export interface Message {
  id: string
  message: string
  created_at: string
}

export interface Review {
  id: string
  rating: number
  comment?: string
  created_at: string
}

export interface SendMessageData {
  message: string
}

export interface CreateReviewData {
  rating: number
  comment?: string
}
