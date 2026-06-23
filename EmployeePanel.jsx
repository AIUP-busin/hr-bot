import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api.js'

const PRIMARY = '#ea580c'
const STEPS = [
  { key: 'arrived', label: 'Keldim', icon: '🏢' },
  { key: 'lunch_out', label: 'Tushlikka chiqdim', icon: '🍽️' },
  { key: 'lunch_in', label: 'Tushlikdan keldim', icon: '↩️' },
  { key: 'left', label: 'Ketdim', icon: '🚪' },
]

export default function EmployeePanel({ telegramId }) {
  const [tab, setTab] = useState(0)
  const [profile, setProfile] = useState(null)
  const [todayData, setTodayData] = useState(null)
  const [history, setHistory] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(new Date())
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' })

  useEffect(() => { loadProfile() }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (tab === 0) loadToday()
    else if (tab === 1) loadHistory()
    else if (tab === 2) loadLeaves()
  }, [tab])

  async function loadProfile() {
    const p = await apiGet('/api/employee/profile', { telegram_id: telegramId })
    setProfile(p)
  }

  async function loadToday() {
    const d = await apiGet('/api/employee/today', { telegram_id: telegramId })
    setTodayData(d)
  }

  async function loadHistory() {
    const h = await apiGet('/api/employee/history', { telegram_id: telegramId })
    setHistory(h)
  }

  async function loadLeaves() {
    const l = await apiGet('/api/employee/leaves', { telegram_id: telegramId })
    setLeaves(l)
  }

  async function doCheckIn(step) {
    setLoading(true)
    try {
      // GPS olish
      let lat = null, lng = null
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        )
        lat = pos.coords.latitude; lng = pos.coords.longitude
      } catch { /* GPS bo'lmasa ham davom etamiz */ }

      await apiPost('/api/employee/checkin', { telegram_id: telegramId, step, latitude: lat, longitude: lng })
      await loadToday()
    } catch (e) { alert('Xato: ' + e.message) }
    setLoading(false)
  }

  async function submitLeave() {
    if (!leaveForm.start_date || !leaveForm.end_date) return alert('Sanani kiriting!')
    await apiPost('/api/employee/leaves', { telegram_id: telegramId, ...leaveForm })
    setShowLeaveForm(false)
    setLeaveForm({ start_date: '', end_date: '', reason: '' })
    loadLeaves()
  }

  // Keyingi qadam aniqlash
  function getNextStep() {
    if (!todayData?.checkin) return 0
    const c = todayData.checkin
    if (!c.arrived_at) return 0
    if (!c.lunch_out_at) return 1
    if (!c.lunch_in_at) return 2
    if (!c.left_at) return 3
    return -1 // Barcha qadamlar bajarilgan
  }

  const nextStep = getNextStep()
  const timeStr = now.toTimeString().slice(0, 5)
  const dateStr = now.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.avatar}>{(profile?.name || 'X')[0]}</div>
        <div>
          <div style={s.empName}>{profile?.name || '...'}</div>
          <div style={s.empSub}>{profile?.position} · {profile?.company_name}</div>
        </div>
      </div>

      {/* Bugun (tab 0) */}
      {tab === 0 && (
        <div style={s.content}>
          {/* Soat */}
          <div style={s.clockCard}>
            <div style={s.status}>
              <span style={{ ...s.dot, background: nextStep === -1 ? '#22c55e' : nextStep === 0 ? '#ef4444' : '#ea580c' }} />
              {nextStep === -1 ? 'ISH TUGADI' : nextStep === 0 ? 'ISH BOSHLANMADI' : 'ISH DAVOM ETMOQDA'}
            </div>
            <div style={s.clock}>{timeStr}</div>
            <div style={s.date}>{dateStr}</div>
          </div>

          {/* Qadam progressi */}
          <div style={s.stepsCard}>
            {STEPS.map((step, i) => {
              const done = i < nextStep || nextStep === -1
              const current = i === nextStep
              return (
                <div key={step.key} style={{ ...s.stepItem, ...(i < STEPS.length - 1 ? s.stepBorder : {}) }}>
                  <div style={{ ...s.stepCircle, background: done ? '#22c55e' : current ? PRIMARY : '#2a2a2a', border: current ? `2px solid ${PRIMARY}` : 'none' }}>
                    {done ? '✓' : step.icon}
                  </div>
                  <div style={{ ...s.stepLabel, color: done ? '#22c55e' : current ? '#fff' : '#555' }}>{step.label}</div>
                  {todayData?.checkin?.[step.key + '_at'] && (
                    <div style={s.stepTime}>{todayData.checkin[step.key + '_at']}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Keyingi qadam tugmasi */}
          {nextStep >= 0 && nextStep < STEPS.length && (
            <button style={{ ...s.checkBtn, opacity: loading ? 0.6 : 1 }}
              onClick={() => doCheckIn(STEPS[nextStep].key)} disabled={loading}>
              {loading ? 'Saqlanmoqda...' : `${STEPS[nextStep].icon} ${STEPS[nextStep].label}`}
            </button>
          )}
          {nextStep === -1 && (
            <div style={s.doneCard}>✅ Bugungi ish kuni yakunlandi!</div>
          )}

          {/* GPS */}
          <div style={s.gpsCard}>
            📍 GPS manzil <span style={{ color: '#22c55e', fontSize: 12 }}>Faol</span>
          </div>
        </div>
      )}

      {/* Tarix (tab 1) */}
      {tab === 1 && history && (
        <div style={s.content}>
          <div style={s.statsRow}>
            <div style={s.statCard}><div style={{ ...s.statNum, color: '#22c55e' }}>{history.stats.arrived}</div><div style={s.statLabel}>Keldi</div></div>
            <div style={s.statCard}><div style={{ ...s.statNum, color: '#f59e0b' }}>{history.stats.late}</div><div style={s.statLabel}>Kechikdi</div></div>
            <div style={s.statCard}><div style={{ ...s.statNum, color: PRIMARY }}>{history.stats.total_hours}</div><div style={s.statLabel}>Soat</div></div>
          </div>
          {history.history.map((h, i) => (
            <div key={i} style={s.histRow}>
              <div style={s.histDate}>{h.date}</div>
              <div style={s.histTimes}>
                {h.arrived_at ? `▶ ${h.arrived_at}` : '—'} {h.left_at ? `· ⏹ ${h.left_at}` : ''}
              </div>
            </div>
          ))}
          {history.history.length === 0 && <div style={s.empty}>Hali yozuv yo'q</div>}
        </div>
      )}

      {/* Ta'til (tab 2) */}
      {tab === 2 && (
        <div style={s.content}>
          <button style={s.checkBtn} onClick={() => setShowLeaveForm(!showLeaveForm)}>+ Yangi so'rov</button>
          {showLeaveForm && (
            <div style={s.form}>
              {[['Boshlanish', 'start_date', 'date'], ['Tugash', 'end_date', 'date'], ['Sabab', 'reason', 'text']].map(([label, key, type]) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} type={type} value={leaveForm[key]}
                    onChange={e => setLeaveForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <button style={{ ...s.checkBtn, background: '#22c55e' }} onClick={submitLeave}>Yuborish</button>
            </div>
          )}
          <div style={s.leaveStats}>
            {[['Kutilmoqda', leaves.filter(l => l.status === 'pending').length, '#f59e0b'],
              ['Tasdiqlangan', leaves.filter(l => l.status === 'approved').length, '#22c55e'],
              ['Rad etilgan', leaves.filter(l => l.status === 'rejected').length, '#ef4444']
            ].map(([label, count, color]) => (
              <div key={label} style={s.leaveStatCard}>
                <div style={{ color, fontSize: 22, fontWeight: 'bold' }}>{count}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
          {leaves.map((l, i) => (
            <div key={i} style={s.leaveCard}>
              <div style={s.histDate}>{l.start_date} → {l.end_date}</div>
              <div style={s.histTimes}>{l.reason || 'Sabab ko\'rsatilmagan'}</div>
              <span style={{ ...s.badge, background: l.status === 'approved' ? '#22c55e' : l.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                {l.status === 'approved' ? 'Tasdiqlangan' : l.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
              </span>
            </div>
          ))}
          {leaves.length === 0 && !showLeaveForm && <div style={s.empty}>Hali ta'til so'rovi yo'q</div>}
        </div>
      )}

      {/* Profil (tab 3) */}
      {tab === 3 && profile && (
        <div style={s.content}>
          <div style={s.profileCard}>
            <div style={s.profileAvatar}>{profile.name[0]}</div>
            <div style={s.empName}>{profile.name}</div>
            <div style={s.empSub}>{profile.position} · {profile.company_name}</div>
          </div>
          {[['Filial', profile.company_name], ['Lavozim', profile.position],
            ['Jadval', profile.schedule], ['To\'lov', profile.salary_type === 'monthly' ? 'Oylik' : 'Soatlik'],
            ['Maosh', `${Number(profile.salary).toLocaleString()} so'm`]
          ].map(([label, value]) => (
            <div key={label} style={s.infoRow}>
              <span style={s.infoLabel}>{label}</span>
              <span style={s.infoValue}>{value || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div style={s.nav}>
        {[['🏠', 'Bugun'], ['📅', 'Tarix'], ['🌴', "Ta'til"], ['👤', 'Profil']].map(([icon, label], i) => (
          <button key={i} style={{ ...s.navBtn, ...(tab === i ? s.navActive : {}) }} onClick={() => setTab(i)}>
            {icon}<br /><span style={{ fontSize: 10 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#111', color: '#fff', fontFamily: 'system-ui' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#1e1e1e', borderBottom: '1px solid #333' },
  avatar: { width: 44, height: 44, borderRadius: 12, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, flexShrink: 0 },
  empName: { fontSize: 16, fontWeight: '600' },
  empSub: { fontSize: 12, color: '#888', marginTop: 2 },
  content: { flex: 1, overflowY: 'auto', padding: '16px 16px 80px' },
  clockCard: { background: '#1e1e1e', borderRadius: 20, padding: '24px', textAlign: 'center', marginBottom: 16 },
  status: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#888', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  clock: { fontSize: 52, fontWeight: 'bold', letterSpacing: -2 },
  date: { fontSize: 14, color: '#666', marginTop: 8 },
  stepsCard: { background: '#1e1e1e', borderRadius: 20, padding: '16px 20px', marginBottom: 16 },
  stepItem: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 16 },
  stepBorder: { borderBottom: '1px solid #2a2a2a' },
  stepCircle: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  stepLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  stepTime: { fontSize: 13, color: '#888' },
  checkBtn: { width: '100%', padding: '16px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginBottom: 12 },
  doneCard: { textAlign: 'center', padding: '16px', background: '#1a2e1a', borderRadius: 16, color: '#22c55e', marginBottom: 12 },
  gpsCard: { background: '#1e1e1e', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#888', display: 'flex', justifyContent: 'space-between' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 },
  statCard: { background: '#1e1e1e', borderRadius: 14, padding: '14px 8px', textAlign: 'center' },
  statNum: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  histRow: { background: '#1e1e1e', borderRadius: 12, padding: '12px 16px', marginBottom: 8 },
  histDate: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  histTimes: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#555', padding: '40px 0', fontSize: 15 },
  form: { background: '#1e1e1e', borderRadius: 16, padding: 16, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 15 },
  leaveStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 },
  leaveStatCard: { background: '#1e1e1e', borderRadius: 14, padding: '14px 8px', textAlign: 'center' },
  leaveCard: { background: '#1e1e1e', borderRadius: 12, padding: '12px 16px', marginBottom: 8 },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, color: '#fff', marginTop: 6 },
  profileCard: { background: '#1e1e1e', borderRadius: 20, padding: '28px', textAlign: 'center', marginBottom: 16 },
  profileAvatar: { width: 72, height: 72, borderRadius: 20, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 32, margin: '0 auto 12px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e', borderRadius: 12, padding: '14px 16px', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '600' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#1e1e1e', borderTop: '1px solid #333', padding: '8px 0' },
  navBtn: { flex: 1, background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '6px 0', fontSize: 20, textAlign: 'center' },
  navActive: { color: PRIMARY },
}
