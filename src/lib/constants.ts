export const APP_CONFIG = {
  supportPhone: import.meta.env.VITE_SUPPORT_PHONE || '+996500123456',
  supportWhatsApp: import.meta.env.VITE_SUPPORT_WHATSAPP || '+996500123456',
  telegramBotUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'qr_parking_bot',
  messageThrottleMs: 60000, // 1 минута
  maxMessageLength: 500,
  maxCommentLength: 200,
} as const

export const ROUTES = {
  home: '/',
  register: '/register',
  account: '/account',
  contact: (id: string) => `/contact/${id}`,
} as const

export const ERROR_MESSAGES = {
  required: 'Обязательное поле',
  invalidPhone: 'Неверный формат номера телефона',
  invalidVehicleNumber: 'Неверный формат номера авто',
  maxLength: (max: number) => `Максимум ${max} символов`,
  minRating: 'Выберите оценку',
  networkError: 'Ошибка соединения. Проверьте интернет',
  serverError: 'Что-то пошло не так. Попробуйте позже',
  notFound: 'QR код не найден',
  rateLimitError: 'Слишком много запросов. Попробуйте позже',
} as const

export const SUCCESS_MESSAGES = {
  registered: 'Регистрация успешна!',
  messageSent: 'Сообщение отправлено',
  reviewSent: 'Спасибо за отзыв!',
  profileUpdated: 'Профиль обновлен',
} as const
