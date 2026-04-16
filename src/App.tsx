import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AccountPage } from './pages/account/AccountPage'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { RegisterPage } from './pages/register/RegisterPage'
import { ContactPage } from './pages/contact/ContactPage'
import { QRRedirectPage } from './pages/QRRedirectPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contact/:id" element={<ContactPage />} />
        <Route path="/qr/:id" element={<QRRedirectPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
