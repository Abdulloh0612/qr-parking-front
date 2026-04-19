export interface RegistrationData {
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
  whatsapp: string
  instagram: string
  telegram: string
  vk: string
  facebook: string
  photo_url: string
  telegram_bot_enabled: boolean
}

export type RegistrationStep1 = Pick<RegistrationData, 'phone' | 'first_name' | 'last_name' | 'vehicle_number' | 'vehicle_brand'>
export type RegistrationStep2 = Pick<RegistrationData, 'whatsapp' | 'instagram' | 'telegram' | 'vk' | 'facebook'>
