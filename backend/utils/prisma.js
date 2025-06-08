const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Optional: Enable logging for debugging
});

module.exports = prisma;