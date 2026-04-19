import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Button }      from '@/shared/ui/Button'
import { Input }       from '@/shared/ui/Input'
import { PhoneInput }  from '@/shared/ui/PhoneInput'
import { SocialInput } from '@/features/registration/ui/SocialInput'
import { useRegistration } from '@/features/registration/model/useRegistration'
import { validatePhone, validateVehicleNumber, validateInstagram, validateTelegram } from '@/shared/lib/validators'
import { APP_CONFIG } from '@/shared/config'

const slide = {
  enter: (d: number) => ({ x: d * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: -d * 48, opacity: 0 }),
}

const steps = [
  { title: 'Основное',  subtitle: 'Личные данные и авто' },
  { title: 'Контакты',  subtitle: 'Способы связи'        },
  { title: 'Telegram',  subtitle: 'Уведомления'          },
]

interface Step1Data {
  phone: string
  first_name: string
  last_name: string
  vehicle_number: string
  vehicle_brand: string
}

interface Step2Data {
  whatsapp: string
  instagram: string
  telegram: string
  vk: string
  facebook: string
}

const namePattern = /^[A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]+$/

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const qrId = searchParams.get('qr')

  const [step,      setStep]     = useState(1)
  const [direction, setDir]      = useState(1)
  const [telegramBotEnabled, setTelegramBotEnabled] = useState(false)
  const { submitOtp, loading, error } = useRegistration(qrId || 'DEFAULT')

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    defaultValues: { phone: '', first_name: '', last_name: '', vehicle_number: '', vehicle_brand: '' },
    mode: 'onBlur',
  })

  // Step 2 form
  const step2Form = useForm<Step2Data>({
    defaultValues: { whatsapp: '', instagram: '', telegram: '', vk: '', facebook: '' },
    mode: 'onBlur',
  })

  function go(next: number) { setDir(next > step ? 1 : -1); setStep(next) }

  async function handleStep1() {
    const valid = await step1Form.trigger()
    if (valid) go(2)
  }

  async function handleStep2() {
    const valid = await step2Form.trigger()
    if (valid) go(3)
  }

  async function handleFinish() {
    const phone = step1Form.getValues('phone')
    void submitOtp(phone)
  }

  if (!qrId) {
    return (
      <div className="hero-gradient min-h-dvh flex items-center justify-center p-4">
        <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r-lg)', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,0,0,0.15)', border: '1px solid rgba(220,0,0,0.2)' }}>
            <svg style={{ width: 24, height: 24, color: '#ff6b6b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>QR код не найден</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Отсканируйте QR код на наклейке для регистрации</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-gradient min-h-dvh flex flex-col">
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 56, paddingBottom: 32, paddingLeft: 20, paddingRight: 20, textAlign: 'center' }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6"
            style={{ borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>QR Parking</span>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>Регистрация</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{steps[step - 1].subtitle}</p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {steps.map((_s, i) => {
              const n = i + 1
              const active = n === step
              const done   = n < step
              return (
                <div key={n} className="flex items-center gap-3">
                  <div style={{
                    width: active ? 32 : 28, height: active ? 32 : 28,
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.3s ease',
                    color: active ? '#0a0a0a' : done ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    background: active ? '#ffffff' : done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    border: done ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  }}>
                    {done ? (
                      <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : n}
                  </div>
                  {i < 2 && (
                    <div style={{ width: 32, height: 1, background: done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)' }} />
                  )}
                </div>
              )
            })}
          </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, maxWidth: 448, margin: '0 auto', width: '100%', padding: '0 16px 32px' }}>
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div key="s1" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r-lg)', padding: 20 }} className="space-y-4">
                <Controller
                  control={step1Form.control}
                  name="phone"
                  rules={{
                    required: 'Введите номер телефона',
                    validate: (v) => validatePhone(v) || 'Неверный формат (+996XXXXXXXXX)',
                  }}
                  render={({ field, fieldState }) => (
                    <PhoneInput
                      label="Номер телефона"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Имя" placeholder="Азамат"
                    {...step1Form.register('first_name', {
                      required: 'Обязательное поле',
                      validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
                      pattern: { value: namePattern, message: 'Только буквы' },
                    })}
                    error={step1Form.formState.errors.first_name?.message}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, '')
                      step1Form.setValue('first_name', val, { shouldValidate: step1Form.formState.isSubmitted })
                    }}
                  />
                  <Input label="Фамилия" placeholder="Исаков"
                    {...step1Form.register('last_name', {
                      required: 'Обязательное поле',
                      validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
                      pattern: { value: namePattern, message: 'Только буквы' },
                    })}
                    error={step1Form.formState.errors.last_name?.message}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-zА-Яа-яЁёÀ-ÖØ-öø-ÿ\s'-]/g, '')
                      step1Form.setValue('last_name', val, { shouldValidate: step1Form.formState.isSubmitted })
                    }}
                  />
                </div>
                <Input label="Гос. номер" placeholder="01KG123ABC"
                  {...step1Form.register('vehicle_number', {
                    required: 'Обязательное поле',
                    validate: (v) => validateVehicleNumber(v) || 'Только буквы и цифры, 6–10 символов',
                  })}
                  error={step1Form.formState.errors.vehicle_number?.message}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                    step1Form.setValue('vehicle_number', val, { shouldValidate: step1Form.formState.isSubmitted })
                  }}
                />
                <Input label="Марка / модель" placeholder="Toyota Camry"
                  {...step1Form.register('vehicle_brand', {
                    required: 'Обязательное поле',
                    validate: (v) => v.trim().length >= 2 || 'Минимум 2 символа',
                  })}
                  error={step1Form.formState.errors.vehicle_brand?.message}
                />
                <Button fullWidth size="lg" onClick={() => void handleStep1()}>Далее →</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r-lg)', padding: 20 }} className="space-y-4">
                <div>
                  <p style={{ fontWeight: 700, fontSize: 17, color: '#ffffff', fontFamily: "'Syne', sans-serif" }}>Социальные сети</p>
                  <p style={{ fontSize: 14, marginTop: 2, color: 'rgba(255,255,255,0.4)' }}>Необязательно — чтобы с вами могли связаться</p>
                </div>
                <Controller
                  control={step2Form.control}
                  name="whatsapp"
                  rules={{
                    validate: (v) => !v || validatePhone(v) || 'Неверный формат (+996XXXXXXXXX)',
                  }}
                  render={({ field, fieldState }) => (
                    <SocialInput type="whatsapp" label="WhatsApp" placeholder="+996 XXX XXX XXX" inputType="tel"
                      value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  control={step2Form.control}
                  name="instagram"
                  rules={{
                    validate: (v) => !v || validateInstagram(v) || 'Только буквы, цифры, точка и _',
                  }}
                  render={({ field, fieldState }) => (
                    <SocialInput type="instagram" label="Instagram" placeholder="username"
                      value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  control={step2Form.control}
                  name="telegram"
                  rules={{
                    validate: (v) => !v || validateTelegram(v) || 'Введите @username или номер',
                  }}
                  render={({ field, fieldState }) => (
                    <SocialInput type="telegram" label="Telegram" placeholder="@username"
                      value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  control={step2Form.control}
                  name="vk"
                  render={({ field }) => (
                    <SocialInput type="vk" label="VK" placeholder="username"
                      value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} />
                  )}
                />
                <Controller
                  control={step2Form.control}
                  name="facebook"
                  render={({ field }) => (
                    <SocialInput type="facebook" label="Facebook" placeholder="username"
                      value={field.value} onChange={(v) => field.onChange(v.replace(/[^a-zA-Z0-9._]/g, ''))} />
                  )}
                />
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" size="lg" className="flex-1" onClick={() => go(1)}>← Назад</Button>
                  <Button size="lg" className="flex-1" onClick={() => void handleStep2()}>Далее →</Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r-lg)', padding: 20 }} className="space-y-4">
                <div>
                  <p style={{ fontWeight: 700, fontSize: 17, color: '#ffffff', fontFamily: "'Syne', sans-serif" }}>Telegram-уведомления</p>
                  <p style={{ fontSize: 14, marginTop: 2, color: 'rgba(255,255,255,0.4)' }}>Получайте уведомления, когда сканируют ваш QR</p>
                </div>

                {/* Toggle */}
                <label className="flex items-start gap-4 cursor-pointer" style={{
                    padding: 16, borderRadius: 'var(--r-lg)', transition: 'all 0.2s ease',
                    border: telegramBotEnabled ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.1)',
                    background: telegramBotEnabled ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}>
                  <input type="checkbox" checked={telegramBotEnabled}
                    onChange={(e) => setTelegramBotEnabled(e.target.checked)} className="sr-only" />
                  <div style={{
                    marginTop: 2, width: 20, height: 20, borderRadius: 'var(--r-sm)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
                    background: telegramBotEnabled ? '#ffffff' : 'transparent',
                    border: telegramBotEnabled ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.25)',
                  }}>
                    {telegramBotEnabled && (
                      <svg style={{ width: 12, height: 12, color: '#0a0a0a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#ffffff', margin: 0 }}>Активировать Telegram-бота</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Нажмите Start в боте для получения уведомлений</p>
                  </div>
                </label>

                {telegramBotEnabled && (
                  <motion.a
                    href={`https://t.me/${APP_CONFIG.telegramBotUsername}`}
                    target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
                    style={{ background: 'rgba(0,136,204,0.06)', border: '1px solid rgba(0,136,204,0.2)' }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#0088cc' }}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#0088cc' }}>@{APP_CONFIG.telegramBotUsername}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#229ed9' }}>Нажмите кнопку START</p>
                    </div>
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </motion.a>
                )}

                {error && (
                  <div style={{ padding: 16, borderRadius: 'var(--r-lg)', background: 'rgba(220,0,0,0.12)', border: '1px solid rgba(220,0,0,0.25)' }}>
                    <p style={{ fontSize: 13, color: '#ff6b6b', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" size="lg" className="flex-1" onClick={() => go(2)}>← Назад</Button>
                  <Button size="lg" className="flex-1" loading={loading}
                    onClick={() => void handleFinish()}>
                    Завершить ✓
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
