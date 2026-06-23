const express = require('express');
const router = express.Router();
const db = require('../db');

// Xodim profili (telegram_id bo'yicha)
router.get('/profile', (req, res) => {
  const { telegram_id } = req.query;
  const employee = db.prepare('SELECT e.*, c.name as company_name, c.color as company_color FROM employees e JOIN companies c ON c.id = e.company_id WHERE e.telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });
  res.json(employee);
});

// Bugungi holat
router.get('/today', (req, res) => {
  const { telegram_id } = req.query;
  const employee = db.prepare('SELECT * FROM employees WHERE telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });

  const today = new Date().toISOString().split('T')[0];
  let checkin = db.prepare('SELECT * FROM checkins WHERE employee_id = ? AND date = ?').get(employee.id, today);

  if (!checkin) {
    const result = db.prepare('INSERT INTO checkins (employee_id, date) VALUES (?, ?)').run(employee.id, today);
    checkin = db.prepare('SELECT * FROM checkins WHERE id = ?').get(result.lastInsertRowid);
  }

  res.json({ employee, checkin, today });
});

// Check-in / Check-out qadam
router.post('/checkin', (req, res) => {
  const { telegram_id, step, latitude, longitude } = req.body;
  // step: arrived | lunch_out | lunch_in | left

  const employee = db.prepare('SELECT * FROM employees WHERE telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5); // "HH:MM"

  const fieldMap = {
    arrived: 'arrived_at',
    lunch_out: 'lunch_out_at',
    lunch_in: 'lunch_in_at',
    left: 'left_at'
  };

  const field = fieldMap[step];
  if (!field) return res.status(400).json({ error: 'Noto\'g\'ri qadam' });

  let checkin = db.prepare('SELECT * FROM checkins WHERE employee_id = ? AND date = ?').get(employee.id, today);
  if (!checkin) {
    db.prepare('INSERT INTO checkins (employee_id, date) VALUES (?, ?)').run(employee.id, today);
    checkin = db.prepare('SELECT * FROM checkins WHERE employee_id = ? AND date = ?').get(employee.id, today);
  }

  db.prepare(`UPDATE checkins SET ${field} = ?, latitude = ?, longitude = ?, status = 'active' WHERE id = ?`)
    .run(now, latitude || null, longitude || null, checkin.id);

  const updated = db.prepare('SELECT * FROM checkins WHERE id = ?').get(checkin.id);
  res.json({ checkin: updated, time: now });
});

// Tarix
router.get('/history', (req, res) => {
  const { telegram_id } = req.query;
  const employee = db.prepare('SELECT * FROM employees WHERE telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });

  const history = db.prepare('SELECT * FROM checkins WHERE employee_id = ? ORDER BY date DESC LIMIT 30').all(employee.id);
  
  // Statistika
  const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthCheckins = history.filter(c => c.date.startsWith(thisMonth));
  
  const stats = {
    total_hours: 0,
    arrived: monthCheckins.filter(c => c.arrived_at).length,
    late: 0,
    absent: 0
  };

  monthCheckins.forEach(c => {
    if (c.arrived_at && c.left_at) {
      const [ah, am] = c.arrived_at.split(':').map(Number);
      const [lh, lm] = c.left_at.split(':').map(Number);
      stats.total_hours += (lh * 60 + lm - ah * 60 - am) / 60;
    }
    const workStart = employee.schedule ? parseInt(employee.schedule.split('-')[0]) : 9;
    if (c.arrived_at && parseInt(c.arrived_at) > workStart) stats.late++;
  });

  res.json({ history, stats: { ...stats, total_hours: Math.round(stats.total_hours) } });
});

// Ta'til so'rovlari
router.get('/leaves', (req, res) => {
  const { telegram_id } = req.query;
  const employee = db.prepare('SELECT * FROM employees WHERE telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });
  const leaves = db.prepare('SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC').all(employee.id);
  res.json(leaves);
});

// Yangi ta'til so'rovi
router.post('/leaves', (req, res) => {
  const { telegram_id, start_date, end_date, reason } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE telegram_id = ?').get(telegram_id);
  if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });
  const result = db.prepare('INSERT INTO leave_requests (employee_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)').run(employee.id, start_date, end_date, reason);
  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(result.lastInsertRowid);
  res.json(leave);
});

module.exports = router;
