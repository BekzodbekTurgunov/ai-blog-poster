const prisma = require('../config/database');
const aiService = require('../config/openai');
const telegramClient = require('../config/telegram');
const { Api } = require('telegram');
require('dotenv').config();

class SummaryService {
  constructor() {
    this.minPostsForSummary = parseInt(process.env.MIN_POSTS_FOR_SUMMARY) || 5;
    this.targetChannelUsername = process.env.TARGET_CHANNEL_USERNAME;
  }

  async generateAndPostSummary() {
    try {
      console.log('Starting summary generation process...');
      
      // Get unused posts
      const unusedPosts = await this.getUnusedPosts();
      
      if (unusedPosts.length < this.minPostsForSummary) {
        console.log(`Not enough posts for summary. Found: ${unusedPosts.length}, Required: ${this.minPostsForSummary}`);
        return null;
      }

      console.log(`Found ${unusedPosts.length} unused posts. Generating summary...`);
      
      // Generate summary using AI
      const summaryResult = await aiService.summarizePosts(unusedPosts);
      
      // Check if AI decided to skip this content
      if (!summaryResult) {
        console.log('AI decided to skip this content due to poor quality. Posts will remain unused.');
        return null;
      }
      
      // Save summary to database
      const summary = await this.saveSummary(summaryResult, unusedPosts);
      
      // Post to target channel
      const posted = await this.postToChannel(summary);
      
      if (posted) {
        // Mark posts as used and link to summary
        await this.markPostsAsUsed(unusedPosts.map(p => p.id), summary.id);
        
        // Update summary as posted
        await prisma.summary.update({
          where: { id: summary.id },
          data: { 
            isPosted: true,
            postedMessageId: posted.messageId 
          }
        });
        
        console.log(`Summary posted successfully! Message ID: ${posted.messageId}`);
      }
      
      return summary;
      
    } catch (error) {
      console.error('Error in summary generation process:', error);
      throw error;
    }
  }

  async getUnusedPosts() {
    const posts = await prisma.post.findMany({
      where: {
        isUsed: false,
        content: {
          not: ''
        }
      },
      include: {
        channel: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to recent posts
    });
    
    return posts;
  }

  async saveSummary(summaryResult, posts) {
    const summary = await prisma.summary.create({
      data: {
        title: summaryResult.title,
        content: summaryResult.content,
        targetChannelId: this.targetChannelUsername,
        isPosted: false
      }
    });
    
    return summary;
  }

  async postToChannel(summary) {
    try {
      if (!this.targetChannelUsername) {
        console.log('No target channel specified. Summary saved but not posted.');
        return null;
      }

      const client = telegramClient.getClient();
      
      // Get target channel
      const result = await client.invoke(new Api.contacts.ResolveUsername({
        username: this.targetChannelUsername.replace('@', '')
      }));
      
      const channel = result.chats[0];
      
      // Prepare message content
      const messageText = `📰 **${summary.title}**\n\n${summary.content}\n\n🤖 *AI tomonidan yaratilgan xulosa*`;
      
      // Send message
      const sentMessage = await client.invoke(new Api.messages.SendMessage({
        peer: channel.id,
        message: messageText
      }));
      
      return {
        messageId: sentMessage.id?.toString() || Date.now().toString(),
        channelId: channel.id?.toString() || 'unknown'
      };
      
    } catch (error) {
      console.error('Failed to post to channel:', error);
      throw error;
    }
  }

  async markPostsAsUsed(postIds, summaryId) {
    await prisma.post.updateMany({
      where: {
        id: {
          in: postIds
        }
      },
      data: {
        isUsed: true,
        summaryId: summaryId
      }
    });
    
    console.log(`Marked ${postIds.length} posts as used and linked to summary`);
  }

  async getSummaryStats() {
    const totalSummaries = await prisma.summary.count();
    const postedSummaries = await prisma.summary.count({
      where: { isPosted: true }
    });
    
    const unusedPosts = await prisma.post.count({
      where: { isUsed: false }
    });
    
    const totalPosts = await prisma.post.count();
    
    return {
      totalSummaries,
      postedSummaries,
      unusedPosts,
      totalPosts,
      readyForSummary: unusedPosts >= this.minPostsForSummary
    };
  }

  async getRecentSummaries(limit = 10) {
    const summaries = await prisma.summary.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        posts: {
          include: {
            channel: true
          }
        }
      }
    });
    
    return summaries;
  }

  async forceSummary() {
    // Force generate summary even if not enough posts
    const originalMin = this.minPostsForSummary;
    this.minPostsForSummary = 1;
    
    try {
      const result = await this.generateAndPostSummary();
      return result;
    } finally {
      this.minPostsForSummary = originalMin;
    }
  }
}

module.exports = new SummaryService(); 