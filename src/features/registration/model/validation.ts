import { validatePhone, validateVehicleNumber, validateInstagram, validateTelegram } from '@/shared/lib/validators'
import { ERROR_MESSAGES } from '@/shared/config'
import type { RegistrationStep1, RegistrationStep2 } from './types'

export function validateStep1(data: RegistrationStep1): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.phone.trim())          errors.phone          = ERROR_MESSAGES.required
  else if (!validatePhone(data.phone)) errors.phone      = ERROR_MESSAGES.invalidPhone

  if (!data.first_name.trim())     errors.first_name     = ERROR_MESSAGES.required
  if (!data.last_name.trim())      errors.last_name      = ERROR_MESSAGES.required

  if (!data.vehicle_number.trim()) errors.vehicle_number = ERROR_MESSAGES.required
  else if (!validateVehicleNumber(data.vehicle_number)) errors.vehicle_number = ERROR_MESSAGES.invalidVehicleNumber

  if (!data.vehicle_brand.trim())  errors.vehicle_brand  = ERROR_MESSAGES.required

  return errors
}

export function validateStep2(data: RegistrationStep2): Record<string, string> {
  const errors: Record<string, string> = {}

  if (data.instagram && !validateInstagram(data.instagram)) errors.instagram = 'Неверный формат'
  if (data.whatsapp  && !validatePhone(data.whatsapp))      errors.whatsapp  = ERROR_MESSAGES.invalidPhone
  if (data.telegram  && !validateTelegram(data.telegram))   errors.telegram  = 'Введите @username или номер'

  return errors
}
