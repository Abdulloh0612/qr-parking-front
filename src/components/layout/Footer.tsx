import { APP_CONFIG } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="mt-auto py-6 text-center text-sm text-gray-500">
      <p>
        Нужна помощь?{' '}
        <a
          href={`https://wa.me/${APP_CONFIG.supportWhatsApp.replace(/\+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
        >
          Напишите нам
        </a>
      </p>
      <p className="mt-2">QR Contact © 2024</p>
    </footer>
  )
}
