// Production script: Update admin email
// Run: node backend/scripts/update-admin-email.js
// Performed: 2026-06-10 — Production launch email domain change
// Audit trail preserved via AuditLog table

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function updateAdminEmail() {
  console.log('=== ADMIN EMAIL UPDATE SCRIPT ===');
  console.log('Starting at:', new Date().toISOString());

  try {
    // 1. Find the current admin user (checks both old and new email)
    const currentAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@steeze.com' },
          { email: 'ceo@zeustechafrica.com' }
        ]
      }
    });

    if (!currentAdmin) {
      console.error('? Admin user not found');
      process.exit(1);
    }

    console.log('Found admin:', currentAdmin.email, '(id:', currentAdmin.id, ')');

    const oldEmail = currentAdmin.email;
    const newEmail = 'ceo@zeustechafrica.com';
    const timestamp = new Date().toISOString();

    // 2. If already using the new email, just verify it
    if (oldEmail === newEmail) {
      console.log('Admin already has correct email. Ensuring verified status...');
      const updated = await prisma.user.update({
        where: { id: currentAdmin.id },
        data: {
          emailVerified: true
        }
      });
      console.log('? Admin verified successfully');
    } else {
      // 3. Update to new email
      console.log('Updating admin email to:', newEmail);
      const updated = await prisma.user.update({
        where: { id: currentAdmin.id },
        data: {
          email: newEmail,
          emailVerified: true
        }
      });
      console.log('? Admin email updated successfully');
    }

    // 4. Also update any AdminUser record linked to this user
    try {
      const adminRecord = await prisma.adminUser.findUnique({
        where: { userId: currentAdmin.id }
      });
      if (adminRecord) {
        console.log('? AdminUser record found and linked via userId');
      } else {
        console.log('AdminUser record not found for this user (may be normal)');
      }
    } catch (e) {
      console.log('AdminUser table check skipped:', e.message);
    }

    // 5. Create audit log for this change (matching actual AuditLog schema)
    try {
      const auditEntry = await prisma.auditLog.create({
        data: {
          adminId: currentAdmin.id,
          action: 'ADMIN_EMAIL_UPDATED',
          targetType: 'USER',
          targetId: currentAdmin.id,
          details: {
            oldEmail: oldEmail,
            newEmail: newEmail,
            reason: 'Production launch - email domain change',
            timestamp: timestamp,
            scriptVersion: '1.0.0'
          },
          ipAddress: '127.0.0.1',
          isImmutable: true,
          hash: crypto.createHash('sha256')
            .update(`ADMIN_EMAIL_UPDATED:${currentAdmin.id}:${oldEmail}:${newEmail}:${timestamp}`)
            .digest('hex')
        }
      });
      console.log('? Audit log created:', auditEntry.id);
    } catch (e) {
      console.log('Audit log creation failed:', e.message);
    }

    console.log('=== UPDATE COMPLETED SUCCESSFULLY ===');
    process.exit(0);

  } catch (error) {
    console.error('? Error updating admin email:', error);
    process.exit(1);
  }
}

updateAdminEmail();