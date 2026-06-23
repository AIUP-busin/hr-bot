const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const MINI_APP_URL = process.env.MINI_APP_URL;

// ==================== /start ====================
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id;
  const startParam = ctx.message.text.split(' ')[1]; // invite token

  // --- Xodim invite link orqali kelgan ---
  if (startParam && startParam.startsWith('emp_')) {
    const token = startParam;
    const employee = db.prepare('SELECT * FROM employees WHERE invite_token = ?').get(token);

    if (!employee) {
      return ctx.reply('❌ Havola noto\'g\'ri yoki muddati o\'tgan.');
    }

    if (employee.is_active && employee.telegram_id && employee.telegram_id !== telegramId) {
      return ctx.reply('❌ Bu havola boshqa foydalanuvchi tomonidan ishlatilgan.');
    }

    // Xodimni faollashtirish
    db.prepare('UPDATE employees SET telegram_id = ?, is_active = 1, invite_token = NULL WHERE id = ?')
      .run(telegramId, employee.id);

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(employee.company_id);

    await ctx.reply(
      `✅ Xush kelibsiz, *${employee.name}*!\n\n` +
      `🏢 Kompaniya: *${company.name}*\n` +
      `💼 Lavozim: *${employee.position}*\n\n` +
      `Quyidagi tugma orqali ilovangizni oching:`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.webApp('📱 Mening panelingim', MINI_APP_URL)]
        ]).resize()
      }
    );
    return;
  }

  // --- Admin yoki yangi foydalanuvchi ---
  const existingCompany = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegramId);

  if (existingCompany) {
    // Admin qaytib keldi
    return ctx.reply(
      `👋 Xush kelibsiz, *${ctx.from.first_name}*!\n\n` +
      `🏢 *${existingCompany.name}* kompaniyangizni boshqaring:`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.webApp('🖥️ Admin paneli', MINI_APP_URL)]
        ]).resize()
      }
    );
  }

  // Yangi foydalanuvchi — kompaniya ro'yxatdan o'tkazish
  await ctx.reply(
    `👋 Salom, *${ctx.from.first_name}*!\n\n` +
    `🚀 *HR Boshqaruv*ga xush kelibsiz!\n\n` +
    `Boshlash uchun kompaniya nomingizni yuboring:`,
    { parse_mode: 'Markdown' }
  );

  // State: kompaniya nomi kutilmoqda
  db.prepare('INSERT OR IGNORE INTO companies (name, admin_telegram_id) VALUES (?, ?)').run('__pending__', telegramId);
});

// ==================== Kompaniya nomi qabul qilish ====================
bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id;
  const text = ctx.message.text;

  if (text.startsWith('/')) return;

  const company = db.prepare('SELECT * FROM companies WHERE admin_telegram_id = ?').get(telegramId);

  if (company && company.name === '__pending__') {
    db.prepare('UPDATE companies SET name = ? WHERE admin_telegram_id = ?').run(text, telegramId);

    return ctx.reply(
      `✅ *${text}* kompaniyasi yaratildi!\n\nAdmin panelingizni oching:`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.webApp('🖥️ Admin paneli', MINI_APP_URL)]
        ]).resize()
      }
    );
  }
});

module.exports = bot;
