const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
require('dotenv').config();

class TelegramClientWrapper {
  constructor() {
    this.apiId = parseInt(process.env.TELEGRAM_API_ID);
    this.apiHash = process.env.TELEGRAM_API_HASH;
    this.session = new StringSession(process.env.TELEGRAM_SESSION || '');
    this.client = null;
  }

  async connect() {
    try {
      this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      });

      console.log('Connecting to Telegram...');
      await this.client.start({
        phoneNumber: async () => {
          throw new Error('Session string required. Please generate session first.');
        },
        password: async () => {
          throw new Error('Session string required. Please generate session first.');
        },
        phoneCode: async () => {
          throw new Error('Session string required. Please generate session first.');
        },
        onError: (err) => console.error('Telegram connection error:', err),
      });

      console.log('Successfully connected to Telegram!');
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      console.log('Disconnected from Telegram');
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Telegram client not connected. Call connect() first.');
    }
    return this.client;
  }
}

module.exports = new TelegramClientWrapper(); 