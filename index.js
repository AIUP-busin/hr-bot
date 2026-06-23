require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bot = require('./bot');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employee');

const app = express();
app.use(cors());
app.use(express.json());

// API yo'llari
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

// Sog'liq tekshiruvi
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server ${PORT}-portda ishlamoqda`);
});

// Botni ishga tushirish
bot.launch().then(() => {
  console.log('🤖 Bot ishga tushdi!');
}).catch(err => {
  console.error('❌ Bot xatosi:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
