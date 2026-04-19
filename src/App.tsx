import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage }       from './pages/home/ui/HomePage'
import { AccountPage }    from './pages/account/ui/AccountPage'
import { AdminPage }      from './pages/admin/dashboard/ui/AdminPage'
import { AdminLoginPage } from './pages/admin/login/ui/AdminLoginPage'
import { RegisterPage }   from './pages/register/ui/RegisterPage'
import { ContactPage }    from './pages/contact/ui/ContactPage'
import { QRRedirectPage } from './pages/qr-redirect/ui/QRRedirectPage'
import { AdminRoute }     from './shared/lib/AdminRoute'

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
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
