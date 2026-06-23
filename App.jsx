import { useEffect, useState } from 'react'
import AdminPanel from './pages/AdminPanel.jsx'
import EmployeePanel from './pages/EmployeePanel.jsx'
import { apiGet } from './api.js'

export default function App() {
  const [role, setRole] = useState(null) // 'admin' | 'employee' | null
  const [loading, setLoading] = useState(true)
  const [telegramId, setTelegramId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) {
      setError('Telegram WebApp topilmadi. Botdan oching.')
      setLoading(false)
      return
    }

    tg.ready()
    tg.expand()

    const userId = tg.initDataUnsafe?.user?.id
    if (!userId) {
      setError('Foydalanuvchi aniqlanmadi.')
      setLoading(false)
      return
    }

    setTelegramId(userId)

    // Rol aniqlash: avval admin, keyin xodim tekshiramiz
    Promise.allSettled([
      apiGet('/api/admin/company', { telegram_id: userId }),
      apiGet('/api/employee/profile', { telegram_id: userId })
    ]).then(([adminRes, empRes]) => {
      if (adminRes.status === 'fulfilled') {
        setRole('admin')
      } else if (empRes.status === 'fulfilled') {
        setRole('employee')
      } else {
        setError('Siz hali ro\'yxatdan o\'tmagansiz.\nBotni /start orqali boshlang.')
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.logo}>HR</div>
      <p style={{ color: '#ea580c', marginTop: 16 }}>Yuklanmoqda...</p>
    </div>
  )

  if (error) return (
    <div style={styles.center}>
      <div style={styles.logo}>HR</div>
      <p style={{ color: '#ff4444', marginTop: 16, textAlign: 'center', padding: '0 24px' }}>{error}</p>
    </div>
  )

  if (role === 'admin') return <AdminPanel telegramId={telegramId} />
  if (role === 'employee') return <EmployeePanel telegramId={telegramId} />

  return null
}

const styles = {
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', background: '#1a1a1a'
  },
  logo: {
    width: 80, height: 80, borderRadius: 20,
    background: '#ea580c', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 28, fontWeight: 'bold', color: '#fff'
  }
}
