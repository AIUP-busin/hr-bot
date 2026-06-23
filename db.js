const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'hr_bot.db'));

// Jadvallarni yaratish
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    admin_telegram_id INTEGER UNIQUE NOT NULL,
    color TEXT DEFAULT '#ea580c',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    telegram_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    position TEXT DEFAULT 'Xodim',
    schedule TEXT DEFAULT '09:00-18:00',
    salary_type TEXT DEFAULT 'monthly',
    salary INTEGER DEFAULT 0,
    invite_token TEXT UNIQUE,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    arrived_at TEXT,
    lunch_out_at TEXT,
    lunch_in_at TEXT,
    left_at TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

module.exports = db;
