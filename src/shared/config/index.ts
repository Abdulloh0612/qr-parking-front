export const APP_CONFIG = {
  supportPhone:       import.meta.env.VITE_SUPPORT_PHONE        || '+996500123456',
  supportWhatsApp:    import.meta.env.VITE_SUPPORT_WHATSAPP     || '+996500123456',
  telegramBotUsername:import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'qr_parking_bot',
  maxMessageLength:   500,
} as const

export const ROUTES = {
  home:     '/',
  register: '/register',
  account:  '/account',
} as const

export const ERROR_MESSAGES = {
  required:             'Обязательное поле',
  invalidPhone:         'Неверный формат (+996XXXXXXXXX)',
  invalidVehicleNumber: 'Только буквы и цифры, 6–10 символов',
  networkError:         'Ошибка соединения. Проверьте интернет',
  serverError:          'Что-то пошло не так. Попробуйте позже',
} as const
