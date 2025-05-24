const cron = require('node-cron');
const summaryService = require('../services/summaryService');
require('dotenv').config();

class CronJobs {
  constructor() {
    this.jobs = new Map();
    this.summaryCronSchedule = process.env.SUMMARY_CRON_SCHEDULE || '0 */6 * * *';
  }

  startSummaryJob() {
    const jobName = 'summary-generation';
    
    if (this.jobs.has(jobName)) {
      console.log('Summary job is already running');
      return;
    }

    const job = cron.schedule(this.summaryCronSchedule, async () => {
      try {
        console.log('🤖 Starting scheduled summary generation...');
        const result = await summaryService.generateAndPostSummary();
        
        if (result) {
          console.log('✅ Summary generated and posted successfully');
        } else {
          console.log('ℹ️ No summary generated (not enough posts)');
        }
      } catch (error) {
        console.error('❌ Error in scheduled summary generation:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Tashkent'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`✅ Summary generation job started with schedule: ${this.summaryCronSchedule}`);
  }

  startStatsJob() {
    const jobName = 'stats-logging';
    
    if (this.jobs.has(jobName)) {
      console.log('Stats job is already running');
      return;
    }

    // Log stats every hour
    const job = cron.schedule('0 * * * *', async () => {
      try {
        const stats = await summaryService.getSummaryStats();
        console.log('📊 Current stats:', {
          totalPosts: stats.totalPosts,
          unusedPosts: stats.unusedPosts,
          totalSummaries: stats.totalSummaries,
          readyForSummary: stats.readyForSummary
        });
      } catch (error) {
        console.error('Error logging stats:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Tashkent'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log('✅ Stats logging job started (hourly)');
  }

  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`❌ Stopped job: ${jobName}`);
    }
  }

  stopAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      console.log(`❌ Stopped job: ${jobName}`);
    }
    this.jobs.clear();
    console.log('❌ All cron jobs stopped');
  }

  getJobsStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running,
        lastDate: job.lastDate(),
        nextDate: job.nextDate()
      };
    }
    return status;
  }

  // Manual triggers
  async triggerSummaryNow() {
    try {
      console.log('🚀 Manually triggering summary generation...');
      const result = await summaryService.generateAndPostSummary();
      return result;
    } catch (error) {
      console.error('Error in manual summary trigger:', error);
      throw error;
    }
  }

  async forceSummaryNow() {
    try {
      console.log('🚀 Force generating summary...');
      const result = await summaryService.forceSummary();
      return result;
    } catch (error) {
      console.error('Error in force summary:', error);
      throw error;
    }
  }

  startAllJobs() {
    this.startSummaryJob();
    this.startStatsJob();
    console.log('🚀 All cron jobs started successfully!');
  }
}

module.exports = new CronJobs(); 