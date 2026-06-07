import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Admin user seed script starting...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@steeze.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'super_admin';
  
  if (!adminPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable is required');
    console.error('   Run: ADMIN_PASSWORD="YourSecurePassword" node prisma/seed-admin.js');
    process.exit(1);
  }
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    console.log(`   Role: ${existingAdmin.role}`);
    return;
  }
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: hashedPassword,
      username: adminUsername,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      isBanned: false,
      isSuspended: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });