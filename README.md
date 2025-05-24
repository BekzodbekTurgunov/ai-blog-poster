# AI Blog Poster 🤖📰

Telegram kanallaridan avtomatik ravishda postlarni eshitib, AI yordamida ularni tahlil qilib xulosa yaratadigan va belgilangan kanalga post qiladigan dastur.

## ✨ Xususiyatlar

- 📡 Telegram user account orqali MVP kanallarni avtomatik aniqlash va eshitish
- 🗄️ PostgreSQL database'da postlarni saqlash
- 🤖 OpenAI GPT-4 yordamida postlarni tahlil qilish
- 📝 Avtomatik xulosa yaratish va @mvpsummirize kanaliga post qilish
- ⏰ Cron job orqali muntazam ishlov berish
- 📊 Real-time statistika va monitoring

## 🛠️ Texnologiyalar

- **Node.js** - Asosiy runtime
- **PostgreSQL** - Ma'lumotlar bazasi
- **Prisma ORM** - Database management
- **Telegram Library** - User account boshqaruvi
- **OpenAI API** - AI summarization
- **Node-cron** - Scheduled tasks

## 📋 Talablar

- Node.js 16+
- PostgreSQL
- Telegram API credentials
- OpenAI API key

## 🚀 O'rnatish

### 1. Repository'ni clone qiling

\`\`\`bash
git clone <repository-url>
cd ai-blog-poster
\`\`\`

### 2. Dependencies'larni o'rnating

\`\`\`bash
npm install
\`\`\`

### 3. Environment variables'ni sozlang

\`config.env.example\` faylini \`.env\` deb nusxalang va quyidagi ma'lumotlarni to'ldiring:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_blog_poster"

# Telegram User Account
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION=your_session_string_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Target Channel for posting summaries (fixed to @mvpsummirize)
TARGET_CHANNEL_USERNAME=@mvpsummirize

# Monitored channels will automatically detect MVP 1, MVP 2, MVP 3 channels (case insensitive)

# Cron schedule for summary job (default: every 6 hours)
SUMMARY_CRON_SCHEDULE="0 */6 * * *"

# Minimum posts for summary generation
MIN_POSTS_FOR_SUMMARY=5
\`\`\`

### 4. Telegram API ma'lumotlarini oling

1. [my.telegram.org](https://my.telegram.org) ga kiring
2. API ID va API Hash yarating
3. Ularni \`.env\` fayliga qo'shing

### 5. Database'ni sozlang

\`\`\`bash
# Prisma client generate qiling
npm run db:generate

# Database schema'ni push qiling
npm run db:push
\`\`\`

### 6. Telegram session yarating

\`\`\`bash
npm run setup-session
\`\`\`

Bu buyruq sizdan telefon raqamingizni va verification code'ni so'raydi. Session string yaratilgandan keyin uni \`.env\` faylidagi \`TELEGRAM_SESSION\` ga qo'shing.

## 🎯 Ishlatish

### Dasturni ishga tushiring

\`\`\`bash
npm start
\`\`\`

### Database'ni ko'rish

\`\`\`bash
npm run db:studio
\`\`\`

## 📊 Architecture

\`\`\`
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│ MVP 1, MVP 2,   │    │ Auto Detect  │    │ Database    │
│ MVP 3 Channels  │───▶│ & Save Posts │───▶│ (PostgreSQL)│
└─────────────────┘    └──────────────┘    └─────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│ @mvpsummirize   │◀───│ AI Summary   │◀───│ Cron Job    │
│ Channel         │    │ (OpenAI)     │    │ (Scheduled) │
└─────────────────┘    └──────────────┘    └─────────────┘
\`\`\`

## 🔍 Kanal Monitoring

Dastur avtomatik ravishda quyidagi nomli kanallarni aniqlaydi va eshitib turadi:
- **MVP 1** (case insensitive)
- **MVP 2** (case insensitive) 
- **MVP 3** (case insensitive)

Kanal nomi ichida ushbu so'zlar mavjud bo'lsa, dastur avtomatik ravishda uni database'ga qo'shadi va postlarni saqlaydi.

## 📂 Fayl Tuzilishi

\`\`\`
ai-blog-poster/
├── src/
│   ├── config/
│   │   ├── database.js      # Prisma client
│   │   ├── telegram.js      # Telegram client
│   │   └── openai.js        # OpenAI service
│   ├── services/
│   │   ├── channelListener.js  # MVP channel auto-detection
│   │   └── summaryService.js   # AI summarization
│   ├── jobs/
│   │   └── cronJobs.js      # Scheduled tasks
│   └── utils/
│       └── sessionGenerator.js # Session setup
├── prisma/
│   └── schema.prisma        # Database schema
├── index.js                 # Main application
├── package.json
└── README.md
\`\`\`

## 🗄️ Database Structure

### Relationships
- **Channel ← Post**: One-to-Many (bir kanal → ko'p postlar)
- **Summary ← Post**: One-to-Many (bir xulosa → ko'p postlar)

### Key Changes
- Channel table'da `name` va `username` unique emas
- Post va Summary o'rtasida to'g'ridan-to'g'ri bog'lanish
- Avtomatik kanal aniqlash va qo'shish

## 🔧 Manual Commands

Dastur ishga tushgandan keyin quyidagi funksiyalardan foydalanishingiz mumkin:

\`\`\`javascript
const AiBlogPoster = require('./index');
const app = new AiBlogPoster();

// Manual summary yaratish
await app.triggerSummary();

// Majburiy summary (kam post bo'lsa ham)
await app.forceSummary();

// Status ko'rish
const status = await app.getStatus();
console.log(status);
\`\`\`

## ⚠️ Muhim Eslatmalar

1. **Session String**: Bu juda muhim va maxfiy ma'lumot. Uni hech kimga bermang.
2. **User Account**: Bot emas, user account ishlatiladi.
3. **Auto Detection**: MVP kanallar avtomatik aniqlanadi, manual qo'shish shart emas.
4. **Target Channel**: Barcha xulosalar faqat @mvpsummirize kanaliga yuboriladi.
5. **Rate Limits**: Telegram API limits'ni hisobga oling.

## 🛠️ Troubleshooting

### Telegram Connection Issues
- Session string to'g'ri ekanligini tekshiring
- API ID va API Hash to'g'ri ekanligini tekshiring
- Internet aloqangizni tekshiring

### Database Issues
- PostgreSQL service ishlab turganini tekshiring
- Connection string to'g'ri ekanligini tekshiring
- Database permissions'ni tekshiring

### OpenAI Issues
- API key to'g'ri va active ekanligini tekshiring
- Balance'ingizni tekshiring

### Channel Detection Issues
- MVP kanallar nomida "MVP 1", "MVP 2", "MVP 3" so'zlari mavjudligini tekshiring
- Case insensitive, ya'ni "mvp 1", "MVP 1", "Mvp 1" hammasi ishlaydi

## 📈 Monitoring

Dastur quyidagi log'larni chiqaradi:
- Auto-detected MVP channels
- Channel messages received
- Posts saved to database  
- Summary generation status
- Cron job execution
- Error handling

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating
3. Commit qiling
4. Push qiling
5. Pull Request yarating

## 📄 License

MIT License

## 🆘 Support

Muammolar yuzaga kelsa issue yarating yoki contact qiling.

---

**🎉 AI Blog Poster bilan MVP kanallardan avtomatik content yaratishni boshlang!** 