import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { QRRedirectPage } from './pages/QRRedirectPage'
import { RegisterPage } from './pages/register/RegisterPage'
import { AccountPage } from './pages/account/AccountPage'
import { ContactPage } from './pages/contact/ContactPage'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { ROUTES } from './lib/constants'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path="/qr/:id" element={<QRRedirectPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.account} element={<AccountPage />} />
        <Route path="/contact/:id" element={<ContactPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
