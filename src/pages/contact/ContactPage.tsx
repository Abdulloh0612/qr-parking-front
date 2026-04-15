import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Container } from '@/components/layout/Container'
import { Footer } from '@/components/layout/Footer'
import { Loader } from '@/components/ui/Loader'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/animations/PageTransition'
import { ContactCard } from '@/features/contact/components/ContactCard'
import { MessageForm } from '@/features/contact/components/MessageForm'
import { useContactData } from '@/features/contact/hooks/useContactData'

export function ContactPage() {
  const { id } = useParams<{ id: string }>()
  const { contact, loading, error, sendMessage } = useContactData(id || '')

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Контакт" />
        <Container className="flex-1 flex items-center justify-center">
          <Loader size="lg" text="Загрузка..." />
        </Container>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Контакт" />
        <Container className="flex-1 flex items-center justify-center">
          <Card className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">{error || 'QR код не найден'}</p>
            <p className="text-sm text-gray-500">
              Проверьте правильность QR кода или обратитесь к владельцу
            </p>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header title="Контакт владельца" />
        <Container className="py-6 flex-1 space-y-4">
          <ContactCard contact={contact} />
          <MessageForm onSendMessage={sendMessage} />
        </Container>
        <Footer />
      </div>
    </PageTransition>
  )
}
