const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

class SessionGenerator {
  async generateSession() {
    try {
      console.log('🔑 Telegram Session Generator');
      console.log('============================\n');
      
      // Get API credentials
      const apiId = process.env.TELEGRAM_API_ID || await ask('API ID: ');
      const apiHash = process.env.TELEGRAM_API_HASH || await ask('API Hash: ');
      
      if (!apiId || !apiHash) {
        throw new Error('API ID and API Hash are required');
      }

      console.log('\n📱 Creating Telegram client...');
      
      const session = new StringSession('');
      const client = new TelegramClient(session, parseInt(apiId), apiHash, {
        connectionRetries: 5,
      });

      await client.start({
        phoneNumber: async () => {
          return await ask('📞 Phone number (with country code, e.g., +998901234567): ');
        },
        password: async () => {
          return await ask('🔒 2FA Password (if enabled): ');
        },
        phoneCode: async () => {
          return await ask('📨 Verification code from Telegram: ');
        },
        onError: (err) => {
          console.error('❌ Error:', err);
        },
      });

      console.log('\n✅ Successfully connected!');
      
      const sessionString = client.session.save();
      
      console.log('\n🎉 Session string generated successfully!');
      console.log('=====================================');
      console.log('Save this session string in your .env file:');
      console.log(`TELEGRAM_SESSION="${sessionString}"`);
      console.log('=====================================\n');
      
      console.log('⚠️  IMPORTANT:');
      console.log('- Keep this session string secure and private');
      console.log('- Do not share it with anyone');
      console.log('- Add it to your .env file as TELEGRAM_SESSION');
      console.log('- This session will allow your app to act as your Telegram account\n');

      await client.disconnect();
      rl.close();
      
      return sessionString;
      
    } catch (error) {
      console.error('❌ Failed to generate session:', error);
      rl.close();
      throw error;
    }
  }
}

// If this file is run directly
if (require.main === module) {
  const generator = new SessionGenerator();
  generator.generateSession()
    .then(() => {
      console.log('✅ Session generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Session generation failed:', error);
      process.exit(1);
    });
}

module.exports = SessionGenerator; 