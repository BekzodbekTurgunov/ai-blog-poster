const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Gracefully disconnect on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma; 