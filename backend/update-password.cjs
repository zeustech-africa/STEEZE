const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePassword() {
  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@steeze.com' },
    data: { passwordHash: hash }
  });
  console.log('Password updated for:', user.email);
  await prisma.$disconnect();
}

updatePassword().catch(console.error);
