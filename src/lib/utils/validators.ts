export function validatePhone(phone: string): boolean {
  // Кыргызстан формат: +996XXXXXXXXX (разрешаем ввод с пробелами/скобками/дефисами через нормализацию)
  const normalized = formatPhone(phone)
  const phoneRegex = /^\+996[0-9]{9}$/
  return phoneRegex.test(normalized)
}

export function validateVehicleNumber(number: string): boolean {
  // Формат: буквы и цифры, например: 01KG123ABC
  const numberRegex = /^[A-Z0-9]{6,10}$/i
  return numberRegex.test(number)
}

export function validateInstagram(handle: string): boolean {
  if (!handle) return true // optional field
  // Instagram handle без @
  const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/
  return instagramRegex.test(handle.replace('@', ''))
}

export function validateTelegram(value: string): boolean {
  if (!value) return true
  const trimmed = value.trim()
  if (!trimmed) return true

  // Разрешаем номер телефона или username (с @ или без)
  if (validatePhone(trimmed)) return true

  const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
  const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/
  return usernameRegex.test(username)
}

export function formatTelegram(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (validatePhone(trimmed)) return formatPhone(trimmed)
  return trimmed.startsWith('@') ? trimmed : '@' + trimmed
}

export function formatPhone(phone: string): string {
  // Убираем все кроме цифр и +
  let cleaned = phone.replace(/[^0-9+]/g, '')

  // Приводим к +996XXXXXXXXX
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  if (cleaned.startsWith('996')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('0')) {
    return '+996' + cleaned.substring(1)
  }
  cleaned = '+996' + cleaned

  return cleaned
}

export function formatVehicleNumber(number: string): string {
  return number.toUpperCase().replace(/\s/g, '')
}
