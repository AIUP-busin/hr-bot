# 🤖 HR Boshqaruv Bot

Telegram Mini App — Admin + Xodim paneli bitta botda.

## 📁 Loyiha tuzilmasi
```
hr-bot/
├── backend/          ← Node.js server (Bot + API + DB)
│   ├── index.js      ← Asosiy kirish nuqtasi
│   ├── bot.js        ← Telegraf bot
│   ├── db.js         ← SQLite database
│   └── routes/
│       ├── admin.js  ← Admin API yo'llari
│       └── employee.js ← Xodim API yo'llari
└── miniapp/          ← React Mini App
    └── src/
        ├── App.jsx         ← Rol aniqlash (admin/xodim)
        ├── api.js          ← API chaqiruvlari
        └── pages/
            ├── AdminPanel.jsx    ← Admin interfeysi
            └── EmployeePanel.jsx ← Xodim interfeysi
```

## 🚀 Boshlash

### 1. Bot yaratish
1. Telegram'da @BotFather ga yozing
2. `/newbot` → nomini kiriting
3. Token oling

### 2. Backend sozlash
```bash
cd backend
cp .env.example .env
# .env faylni tahrirlang:
# BOT_TOKEN=your_token
# MINI_APP_URL=https://your-miniapp.vercel.app
# BOT_USERNAME=your_bot_username

npm install
npm start
```

### 3. Mini App sozlash
```bash
cd miniapp
cp .env.example .env
# .env faylni tahrirlang:
# VITE_API_URL=https://your-backend.railway.app

npm install
npm run build
# build/ papkasini Vercel ga deploy qiling
```

### 4. Mini App URL ni botga ulash
@BotFather → /mybots → botingiz → Bot Settings → Menu Button → URL kiriting

### 5. Deploy (bepul)
- **Backend:** [Railway.app](https://railway.app) — bepul Node.js hosting
- **Mini App:** [Vercel.com](https://vercel.com) — bepul React hosting

## ⚙️ Qanday ishlaydi?

```
Admin /start → Kompaniya yaratadi → Admin paneli
                       ↓
            Xodim qo'shadi → Unique invite link
                       ↓
Xodim linkni bosadi → /start emp_TOKEN → Xodim paneli
```

## 📱 Funksiyalar

| | Admin | Xodim |
|---|---|---|
| Monitoring | ✅ | — |
| Xodim qo'shish | ✅ | — |
| Hisobotlar | ✅ | — |
| Check-in/out | — | ✅ |
| GPS | — | ✅ |
| Ta'til so'rovi | — | ✅ |
| Tarix | — | ✅ |
