const telegramClient = require('../config/telegram');
const prisma = require('../config/database');
const { Api } = require('telegram');
const { NewMessage } = require('telegram/events');
require('dotenv').config();

class ChannelListener {
  constructor() {
    this.isListening = false;
    this.monitoredChannels = [];
    this.mvpChannels = ['MVP 1', 'MVP 2', 'MVP 3'];
  }

  async initialize() {
    try {
      // Connect to Telegram
      await telegramClient.connect();
      
      console.log(`Initialized monitoring for channels containing: ${this.mvpChannels.join(', ')}`);
    } catch (error) {
      console.error('Failed to initialize channel listener:', error);
      throw error;
    }
  }

  async addChannelToDatabase(channelInfo) {
    try {
      // Save or update channel in database
      const dbChannel = await prisma.channel.upsert({
        where: { chatId: channelInfo.chatId },
        update: {
          name: channelInfo.name,
          username: channelInfo.username || '',
          isActive: true
        },
        create: {
          name: channelInfo.name,
          username: channelInfo.username || '',
          chatId: channelInfo.chatId,
          isActive: true
        }
      });

      console.log(`Added channel to database: ${channelInfo.name}`);
      return dbChannel;
    } catch (error) {
      console.error(`Failed to add channel to database:`, error);
      throw error;
    }
  }

  async startListening() {
    if (this.isListening) {
      console.log('Already listening to channels');
      return;
    }

    try {
      const client = telegramClient.getClient();
      
      // Listen for new messages
      client.addEventHandler(this.handleNewMessage.bind(this), new NewMessage({}));
      
      this.isListening = true;
      console.log('Started listening to channels...');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        this.stopListening();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  async handleNewMessage(event) {
    try {
      if (!event.message) return;
      
      const message = event.message;
      const chat = message.chat;
      
      if (!chat) return;
      
      const channelName = chat.title || '';
      const channelUsername = chat.username || '';
      const chatId = chat.id?.toString();
      
      // Check if channel name contains any of the MVP channel names (case insensitive)
      const shouldMonitor = this.mvpChannels.some(mvpName => 
        channelName.toLowerCase().includes(mvpName.toLowerCase())
      );
      
      if (!shouldMonitor) return;
      
      // Add channel to database if not exists
      await this.addChannelToDatabase({
        name: channelName,
        username: channelUsername,
        chatId: chatId
      });
      
      // Get channel from database
      const channel = await prisma.channel.findFirst({
        where: { 
          chatId,
          isActive: true 
        }
      });
      
      if (!channel) return;
      
      // Filter message content
      if (!this.shouldSaveMessage(message)) {
        return;
      }
      
      // Extract media URLs if any
      const mediaUrls = await this.extractMediaUrls(message);
      
      // Save message to database
      await prisma.post.create({
        data: {
          messageId: message.id.toString(),
          channelId: channel.id,
          content: message.text || message.message || '',
          authorName: message.fromId?.userId?.toString() || null,
          mediaUrls,
          isUsed: false
        }
      });
      
      console.log(`Saved post from ${channel.name}: ${(message.text || message.message || '').substring(0, 50)}...`);
      
    } catch (error) {
      // Avoid duplicate entry errors
      if (error.code === 'P2002') {
        console.log('Duplicate message, skipping...');
        return;
      }
      console.error('Error handling new message:', error);
    }
  }

  shouldSaveMessage(message) {
    const text = message.text || message.message || '';
    
    // Skip empty messages
    if (!text.trim()) return false;
    
    // Skip very short messages (less than 50 characters for meaningful content)
    if (text.length < 50) return false;
    
    // Skip messages that are just links
    if (text.match(/^https?:\/\/\S+$/)) return false;
    
    // Skip messages with only emojis
    if (text.match(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u)) {
      return false;
    }
    
    // Skip messages that are mostly numbers or symbols
    const textWithoutSpaces = text.replace(/\s+/g, '');
    const letterCount = (textWithoutSpaces.match(/[a-zA-Zа-яёА-ЯЁўқғҳОЎҚҒҲ]/g) || []).length;
    if (letterCount < textWithoutSpaces.length * 0.6) {
      return false;
    }
    
    return true;
  }

  async extractMediaUrls(message) {
    const urls = [];
    
    if (message.media) {
      // Handle different media types
      if (message.media.photo) {
        urls.push('photo');
      } else if (message.media.document) {
        urls.push('document');
      } else if (message.media.video) {
        urls.push('video');
      }
    }
    
    return urls;
  }

  async stopListening() {
    this.isListening = false;
    await telegramClient.disconnect();
    console.log('Stopped listening to channels');
  }

  async getChannelStats() {
    const stats = await prisma.channel.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });
    
    return stats.map(channel => ({
      name: channel.name,
      username: channel.username,
      postsCount: channel._count.posts,
      isActive: channel.isActive
    }));
  }
}

module.exports = new ChannelListener(); 