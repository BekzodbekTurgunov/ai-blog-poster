const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  async summarizePosts(posts) {
    try {
      const postsText = posts.map(post => {
        return `Kanal: ${post.channel.name}\nMuallif: ${post.authorName || 'Noma\'lum'}\nMatn: ${post.content}\n---`;
      }).join('\n\n');

      const prompt = `
Siz 15 yillik tajribaga ega professional tech blog editorsiz va content strategisiz. Sizning vazifangiz - telegram kanallaridan kelgan postlarni chuqur tahlil qilib, yuqori sifatli, ma'noli va qo'shimcha qiymat beradigan blog post yaratish.

MUHIM: Faqat ma'noli, foydali va qiziqarli content yarating. Agar postlarda yetarlicha ma'lumot yoki context yo'q bo'lsa, "SKIP" deb javob bering.

Tahlil qilinadigan postlar:
${postsText}

PROFESSIONAL STANDARTLAR:
1. Har bir postni chuqur tahlil qiling - nima haqida, nimaga foydali, qanday ahamiyatga ega
2. Faqat ta'lim beruvchi, ilhomlantiruvchi yoki amaliy qiymat beradigan content yarating
3. Agar postlar oddiy takroriy ma'lumot yoki mazmunsiz bo'lsa - "SKIP" deb javob bering
4. Technical detallarni oddiy tilga tarjima qiling
5. Real hayotdagi qo'llanishini ko'rsating

CONTENT TALABLARI:
- O'zbek tilida professional darajada yozing
- 250-400 so'z oralig'ida (qisqa emas, batafsil)
- Aniq faktlar va ma'lumotlar bering
- Amaliy maslahatlar qo'shing
- Vizual emoji'lar bilan boyiting
- Relevant hashtag'lar qo'shing

FORMAT:
Sarlavha: [Professional va qiziqarli sarlavha]
Xulosa: [Chuqur tahlil va amaliy ma'lumotlar]

ESLATMA: Agar content ma'nosiz yoki takroriy bo'lsa, albatta "SKIP" deb javob bering.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Siz professional content yaratuvchi va tahlilchisiz. O\'zbek tilida mukammal yozasiz. Faqat yuqori sifatli content yaratish sizning professional standartingiz.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const result = response.choices[0].message.content.trim();
      
      // Check if AI decided to skip this content
      if (result.toUpperCase().includes('SKIP')) {
        console.log('AI decided to skip this content as it lacks quality/meaning');
        return null;
      }
      
      // Parse title and content
      const lines = result.split('\n');
      const titleLine = lines.find(line => line.startsWith('Sarlavha:'));
      const contentStartIndex = lines.findIndex(line => line.startsWith('Xulosa:'));
      
      const title = titleLine ? titleLine.replace('Sarlavha:', '').trim() : 'Yangiliklar Xulosasi';
      const content = contentStartIndex !== -1 
        ? lines.slice(contentStartIndex).join('\n').replace('Xulosa:', '').trim()
        : result;

      // Additional quality check
      if (content.length < 100 || title.length < 10) {
        console.log('Generated content is too short, skipping...');
        return null;
      }

      return {
        title,
        content,
        originalPostsCount: posts.length
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to summarize posts: ' + error.message);
    }
  }

  async generateSessionString(phoneNumber) {
    // This is for initial setup only
    const prompt = `
Telegram user account uchun session string yaratish uchun quyidagi qadamlarni bajaring:

1. telegram paketidan foydalaning
2. API ID va API Hash olish uchun my.telegram.org ga kiring
3. Phone number: ${phoneNumber}
4. Verification code ni kutib turing
5. Session string ni saqlab qoying

Bu funksiya faqat birinchi setup uchun kerak.
`;
    
    console.log(prompt);
    return prompt;
  }
}

module.exports = new AIService(); 