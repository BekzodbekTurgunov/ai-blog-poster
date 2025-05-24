const channelListener = require('./src/services/channelListener');
const cronJobs = require('./src/jobs/cronJobs');
require('dotenv').config();

class AiBlogPoster {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    try {
      if (this.isRunning) {
        console.log('Application is already running');
        return;
      }

      console.log('🚀 Starting AI Blog Poster...');
      console.log('===============================\n');

      // Check environment variables
      this.checkEnvironment();

      // Initialize and start channel listener
      console.log('📡 Initializing channel listener...');
      await channelListener.initialize();
      await channelListener.startListening();

      // Start cron jobs
      console.log('⏰ Starting cron jobs...');
      cronJobs.startAllJobs();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isRunning = true;
      
      console.log('\n✅ AI Blog Poster started successfully!');
      console.log('=======================================');
      console.log('📊 Application Status:');
      console.log('- Channel listening: ✅ Active');
      console.log('- Cron jobs: ✅ Running');
      console.log('- Database: ✅ Connected');
      console.log('\n💡 Use Ctrl+C to stop the application gracefully\n');

      // Show initial stats
      await this.showStats();

    } catch (error) {
      console.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }

  checkEnvironment() {
    const required = [
      'TELEGRAM_API_ID',
      'TELEGRAM_API_HASH', 
      'TELEGRAM_SESSION',
      'DATABASE_URL',
      'OPENAI_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(key => console.error(`  - ${key}`));
      console.error('\nPlease check your .env file and try again.');
      process.exit(1);
    }

    console.log('✅ Environment variables validated');
  }

  async showStats() {
    try {
      const summaryService = require('./src/services/summaryService');
      const stats = await summaryService.getSummaryStats();
      const channelStats = await channelListener.getChannelStats();

      console.log('📊 Current Statistics:');
      console.log('======================');
      console.log(`📝 Total Posts: ${stats.totalPosts}`);
      console.log(`🆕 Unused Posts: ${stats.unusedPosts}`);
      console.log(`📰 Total Summaries: ${stats.totalSummaries}`);
      console.log(`✅ Posted Summaries: ${stats.postedSummaries}`);
      console.log(`🚦 Ready for Summary: ${stats.readyForSummary ? 'Yes' : 'No'}`);
      
      console.log('\n📡 Monitored Channels:');
      channelStats.forEach(channel => {
        console.log(`  📢 ${channel.name} (@${channel.username}) - ${channel.postsCount} posts`);
      });
      console.log('');
    } catch (error) {
      console.error('Error showing stats:', error);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
      
      try {
        // Stop cron jobs
        cronJobs.stopAllJobs();
        
        // Stop channel listener
        await channelListener.stopListening();
        
        console.log('✅ Application stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Application is not running');
      return;
    }

    cronJobs.stopAllJobs();
    await channelListener.stopListening();
    this.isRunning = false;
    
    console.log('✅ Application stopped');
  }

  // Manual control methods
  async triggerSummary() {
    return await cronJobs.triggerSummaryNow();
  }

  async forceSummary() {
    return await cronJobs.forceSummaryNow();
  }

  async getStatus() {
    const summaryService = require('./src/services/summaryService');
    const stats = await summaryService.getSummaryStats();
    const channelStats = await channelListener.getChannelStats();
    const jobsStatus = cronJobs.getJobsStatus();

    return {
      isRunning: this.isRunning,
      stats,
      channels: channelStats,
      jobs: jobsStatus
    };
  }
}

// If this file is run directly
if (require.main === module) {
  const app = new AiBlogPoster();
  app.start().catch(console.error);
}

module.exports = AiBlogPoster; 