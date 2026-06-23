const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Kompaniya ma'lumotlari
router.get('/company', (req, res) => {
  const { telegram_id } = req.query;
  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegram_id);
  if (!company) return res.status(404).json({ error: 'Kompaniya topilmadi' });
  res.json(company);
});

// Bugungi monitoring
router.get('/dashboard', (req, res) => {
  const { telegram_id } = req.query;
  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegram_id);
  if (!company) return res.status(404).json({ error: 'Kompaniya topilmadi' });

  const today = new Date().toISOString().split('T')[0];
  const employees = db.prepare('SELECT * FROM employees WHERE company_id = ? AND is_active = 1').all(company.id);

  const stats = { arrived: 0, late: 0, absent: 0, on_leave: 0, total: employees.length };

  employees.forEach(emp => {
    const checkin = db.prepare('SELECT * FROM checkins WHERE employee_id = ? AND date = ?').get(emp.id, today);
    const leave = db.prepare('SELECT * FROM leave_requests WHERE employee_id = ? AND ? BETWEEN start_date AND end_date AND status = "approved"').get(emp.id, today);
    if (leave) { stats.on_leave++; return; }
    if (!checkin || !checkin.arrived_at) { stats.absent++; return; }
    const arrivedHour = parseInt(checkin.arrived_at.split(':')[0]);
    const workStart = emp.schedule ? parseInt(emp.schedule.split('-')[0].split(':')[0]) : 9;
    if (arrivedHour > workStart) { stats.late++; } else { stats.arrived++; }
  });

  res.json({ company, stats, today });
});

// Xodimlar ro'yxati
router.get('/employees', (req, res) => {
  const { telegram_id } = req.query;
  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegram_id);
  if (!company) return res.status(404).json({ error: 'Kompaniya topilmadi' });
  const employees = db.prepare('SELECT * FROM employees WHERE company_id = ? ORDER BY created_at DESC').all(company.id);
  res.json(employees);
});

// Yangi xodim qo'shish
router.post('/employees', (req, res) => {
  const { telegram_id, name, position, schedule, salary_type, salary } = req.body;
  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegram_id);
  if (!company) return res.status(404).json({ error: 'Kompaniya topilmadi' });

  const token = 'emp_' + uuidv4().replace(/-/g, '').slice(0, 16);
  const result = db.prepare(
    'INSERT INTO employees (company_id, name, position, schedule, salary_type, salary, invite_token) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(company.id, name, position || 'Xodim', schedule || '09:00-18:00', salary_type || 'monthly', salary || 0, token);

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  const botUsername = process.env.BOT_USERNAME || 'your_bot';
  const inviteLink = `https://t.me/${botUsername}?start=${token}`;
  res.json({ employee, inviteLink });
});

// Xodimni o'chirish
router.delete('/employees/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Hisobotlar
router.get('/reports', (req, res) => {
  const { telegram_id, period } = req.query;
  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegram_id);
  if (!company) return res.status(404).json({ error: 'Kompaniya topilmadi' });
  const today = new Date().toISOString().split('T')[0];
  let dateFilter = '';
  if (period === 'today') dateFilter = `AND c.date = '${today}'`;
  else if (period === 'week') dateFilter = `AND c.date >= date('${today}', '-7 days')`;
  else if (period === 'month') dateFilter = `AND c.date >= date('${today}', '-30 days')`;

  const data = db.prepare(`
    SELECT e.name, e.position, c.date, c.arrived_at, c.lunch_out_at, c.lunch_in_at, c.left_at, c.status
    FROM checkins c JOIN employees e ON e.id = c.employee_id
    WHERE e.company_id = ? ${dateFilter}
    ORDER BY c.date DESC, e.name
  `).all(company.id);
  res.json(data);
});

// Kompaniya sozlamalarini yangilash
router.put('/company', (req, res) => {
  const { telegram_id, name, color } = req.body;
  db.prepare('UPDATE companies SET name = ?, color = ? WHERE admin_telegram_id = ?').run(name, color, telegram_id);
  res.json({ success: true });
});

module.exports = router;
