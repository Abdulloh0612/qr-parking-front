export interface RegistrationStep1 {
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
}

export interface RegistrationStep2 {
  whatsapp: string
  instagram: string
  telegram: string
  vk: string
  facebook: string
}

export interface RegistrationStep3 {
  photo_url: string
  telegram_bot_enabled: boolean
}

export type RegistrationData = RegistrationStep1 & RegistrationStep2 & RegistrationStep3
