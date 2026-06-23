import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete } from '../api.js'

const TABS = ['Kompaniya', 'Xodimlar', 'Hisobotlar']
const PRIMARY = '#ea580c'

export default function AdminPanel({ telegramId }) {
  const [tab, setTab] = useState(0)
  const [company, setCompany] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [employees, setEmployees] = useState([])
  const [reports, setReports] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', position: 'Menejer', schedule: '09:00-18:00', salary_type: 'monthly', salary: '' })
  const [inviteLink, setInviteLink] = useState(null)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    try {
      if (tab === 0) {
        const [comp, dash] = await Promise.all([
          apiGet('/api/admin/company', { telegram_id: telegramId }),
          apiGet('/api/admin/dashboard', { telegram_id: telegramId })
        ])
        setCompany(comp); setDashboard(dash)
      } else if (tab === 1) {
        const emps = await apiGet('/api/admin/employees', { telegram_id: telegramId })
        setEmployees(emps)
      } else if (tab === 2) {
        const reps = await apiGet('/api/admin/reports', { telegram_id: telegramId, period: 'today' })
        setReports(reps)
      }
    } catch (e) { console.error(e) }
  }

  async function addEmployee() {
    if (!newEmployee.name.trim()) return alert('Ism kiritilmagan!')
    try {
      const res = await apiPost('/api/admin/employees', { telegram_id: telegramId, ...newEmployee })
      setInviteLink(res.inviteLink)
      setShowAddForm(false)
      setNewEmployee({ name: '', position: 'Menejer', schedule: '09:00-18:00', salary_type: 'monthly', salary: '' })
      loadData()
    } catch (e) { alert('Xato: ' + e.message) }
  }

  async function removeEmployee(id) {
    if (!confirm('Xodimni o\'chirasizmi?')) return
    await apiDelete(`/api/admin/employees/${id}`)
    loadData()
  }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.compName}>{company?.name || 'Kompaniya'}</div>
          <div style={s.subText}>Admin paneli</div>
        </div>
        <div style={s.avatar}>{(company?.name || 'A')[0]}</div>
      </div>

      {/* Invite link modal */}
      {inviteLink && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <h3 style={{ color: PRIMARY, marginBottom: 12 }}>✅ Xodim qo'shildi!</h3>
            <p style={{ fontSize: 13, marginBottom: 12, color: '#ccc' }}>Quyidagi linkni xodimga yuboring:</p>
            <div style={s.linkBox}>{inviteLink}</div>
            <button style={s.copyBtn} onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Nusxalandi!') }}>📋 Nusxalash</button>
            <button style={s.closeBtn} onClick={() => setInviteLink(null)}>Yopish</button>
          </div>
        </div>
      )}

      {/* Dashboard (tab 0) */}
      {tab === 0 && dashboard && (
        <div style={s.content}>
          <div style={s.statsRow}>
            {[
              { label: 'Keldi', value: dashboard.stats.arrived, color: '#22c55e' },
              { label: 'Kechikdi', value: dashboard.stats.late, color: '#f59e0b' },
              { label: 'Kelmadi', value: dashboard.stats.absent, color: '#ef4444' },
              { label: "Ta'tilda", value: dashboard.stats.on_leave, color: '#8b5cf6' },
            ].map(s2 => (
              <div key={s2.label} style={s.statCard}>
                <div style={{ ...s.statNum, color: s2.color }}>{s2.value}</div>
                <div style={s.statLabel}>{s2.label}</div>
              </div>
            ))}
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Jami xodimlar</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: PRIMARY }}>{dashboard.stats.total}</div>
          </div>
        </div>
      )}

      {/* Xodimlar (tab 1) */}
      {tab === 1 && (
        <div style={s.content}>
          <button style={s.addBtn} onClick={() => setShowAddForm(!showAddForm)}>+ Yangi xodim</button>
          {showAddForm && (
            <div style={s.form}>
              {[['Ism Familiya', 'name', 'text'], ['Lavozim', 'position', 'text'], ['Jadval (09:00-18:00)', 'schedule', 'text'], ['Oylik (so\'m)', 'salary', 'number']].map(([label, key, type]) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} type={type} value={newEmployee[key]}
                    onChange={e => setNewEmployee(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <button style={s.submitBtn} onClick={addEmployee}>✅ Qo'shish</button>
            </div>
          )}
          {employees.map(emp => (
            <div key={emp.id} style={s.empCard}>
              <div style={s.empAvatar}>{emp.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={s.empName}>{emp.name}</div>
                <div style={s.empSub}>{emp.position} · {emp.is_active ? '✅ Faol' : '⏳ Kutmoqda'}</div>
                {emp.invite_token && (
                  <div style={s.pendingTag}>Link yuborilmagan</div>
                )}
              </div>
              <button style={s.delBtn} onClick={() => removeEmployee(emp.id)}>🗑</button>
            </div>
          ))}
          {employees.length === 0 && <div style={s.empty}>Hali xodim yo'q</div>}
        </div>
      )}

      {/* Hisobotlar (tab 2) */}
      {tab === 2 && (
        <div style={s.content}>
          <div style={s.cardTitle}>Bugungi davomat</div>
          {reports.length === 0 && <div style={s.empty}>Bugun hali yozuv yo'q</div>}
          {reports.map((r, i) => (
            <div key={i} style={s.reportRow}>
              <div style={s.empName}>{r.name}</div>
              <div style={s.empSub}>Keldi: {r.arrived_at || '—'} · Ketdi: {r.left_at || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div style={s.nav}>
        {TABS.map((label, i) => (
          <button key={i} style={{ ...s.navBtn, ...(tab === i ? s.navActive : {}) }} onClick={() => setTab(i)}>
            {['🏠', '👥', '📊'][i]}<br /><span style={{ fontSize: 10 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#111', color: '#fff', fontFamily: 'system-ui' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#1e1e1e', borderBottom: '1px solid #333' },
  compName: { fontSize: 18, fontWeight: 'bold' },
  subText: { fontSize: 12, color: '#888', marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 12, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 },
  content: { flex: 1, overflowY: 'auto', padding: '16px 16px 80px' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  statCard: { background: '#1e1e1e', borderRadius: 16, padding: '16px 12px', textAlign: 'center' },
  statNum: { fontSize: 32, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  card: { background: '#1e1e1e', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 14, color: '#888', marginBottom: 8 },
  addBtn: { width: '100%', padding: '14px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginBottom: 16 },
  form: { background: '#1e1e1e', borderRadius: 16, padding: 16, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 15 },
  submitBtn: { width: '100%', padding: 12, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginTop: 8 },
  empCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#1e1e1e', borderRadius: 14, padding: '14px', marginBottom: 10 },
  empAvatar: { width: 44, height: 44, borderRadius: 12, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  empName: { fontSize: 15, fontWeight: '600' },
  empSub: { fontSize: 12, color: '#888', marginTop: 3 },
  pendingTag: { fontSize: 11, color: '#f59e0b', marginTop: 4 },
  delBtn: { background: '#2a2a2a', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 },
  empty: { textAlign: 'center', color: '#555', padding: '40px 0', fontSize: 15 },
  reportRow: { background: '#1e1e1e', borderRadius: 12, padding: '12px 16px', marginBottom: 10 },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#1e1e1e', borderTop: '1px solid #333', padding: '8px 0' },
  navBtn: { flex: 1, background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '6px 0', fontSize: 20, textAlign: 'center' },
  navActive: { color: PRIMARY },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#1e1e1e', borderRadius: 20, padding: 24, width: '85%', maxWidth: 360 },
  linkBox: { background: '#2a2a2a', borderRadius: 10, padding: 12, fontSize: 13, wordBreak: 'break-all', color: '#ccc', marginBottom: 12 },
  copyBtn: { width: '100%', padding: 12, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', marginBottom: 8 },
  closeBtn: { width: '100%', padding: 12, background: '#2a2a2a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer' },
}
