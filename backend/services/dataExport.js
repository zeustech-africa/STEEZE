import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { uploadFile } from './r2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate JSON export for a specific data type
async function exportProfile(user) {
  return {
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      artistName: user.artistName,
      bio: user.bio,
      profilePicUrl: user.profilePicUrl,
      coverPhotoUrl: user.coverPhotoUrl,
      tagline: user.tagline,
      category: user.category,
      userType: user.userType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  };
}

async function exportPosts(userId) {
  const posts = await prisma.post.findMany({
    where: { creatorId: userId },
    include: {
      interactions: true,
      comments: true,
    }
  });
  return { posts };
}

async function exportInteractions(userId) {
  const likes = await prisma.postInteraction.findMany({
    where: { userId, type: 'like' },
    include: { post: { select: { id: true, title: true } } }
  });

  const comments = await prisma.comment.findMany({
    where: { userId },
    include: { post: { select: { id: true, title: true } } }
  });

  const reposts = await prisma.repost.findMany({
    where: { repostedBy: userId },
    include: { originalPost: { select: { id: true, title: true } } }
  });

  const saves = await prisma.postInteraction.findMany({
    where: { userId, type: 'save' },
    include: { post: { select: { id: true, title: true } } }
  });

  return { likes, comments, reposts, saves };
}

async function exportSocial(userId) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, username: true, artistName: true } } }
  });

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, username: true, artistName: true } } }
  });

  return { followers: followers.map(f => f.follower), following: following.map(f => f.following) };
}

async function exportSubscriptions(userId) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { creator: { select: { id: true, artistName: true, username: true } } }
  });

  const payments = await prisma.payment.findMany({
    where: { userId },
    include: { creator: { select: { artistName: true } } }
  });

  return { subscriptions, payments };
}

async function exportMessages(userId) {
  // Only for Gold users or if they have messages
  const messages = await prisma.message?.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    },
    orderBy: { createdAt: 'asc' }
  }).catch(() => []);
  return { messages: messages || [] };
}

async function exportLoginHistory(userId) {
  const loginHistory = await prisma.loginHistory.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' }
  });
  return { loginHistory };
}

// Generate HTML version of the data
function generateHtmlReport(data, user) {
  const { profile, posts, interactions, social, subscriptions, messages, loginHistory } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>STEEZE Data Export - ${user.username || user.email}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #FFD700; border-bottom: 2px solid #FFD700; padding-bottom: 10px; }
    h2 { color: #666; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>STEEZE Data Export</h1>
  <p>Export date: ${new Date().toLocaleString()}</p>
  <p>User: ${user.username || user.email} (${user.email})</p>

  <h2>Profile</h2>
  <table><tr><th>Field</th><th>Value</th></tr>
    <tr><td>Username</td><td>${profile.profile.username || ''}</td></tr>
    <tr><td>Email</td><td>${profile.profile.email || ''}</td></tr>
    <tr><td>Artist Name</td><td>${profile.profile.artistName || ''}</td></tr>
    <tr><td>Bio</td><td>${profile.profile.bio || ''}</td></tr>
    <tr><td>Joined</td><td>${profile.profile.createdAt || ''}</td></tr>
  </table>

  <h2>Posts (${posts.posts?.length || 0})</h2>
  ${posts.posts?.map(p => `<div><strong>${p.title}</strong> - ${p.createdAt}<br>${p.description || ''}</div>`).join('<hr>') || '<p>No posts</p>'}

  <h2>Interactions</h2>
  <p>Likes: ${interactions.likes?.length || 0}</p>
  <p>Comments: ${interactions.comments?.length || 0}</p>
  <p>Reposts: ${interactions.reposts?.length || 0}</p>
  <p>Saves: ${interactions.saves?.length || 0}</p>

  <h2>Social</h2>
  <p>Followers: ${social.followers?.length || 0}</p>
  <p>Following: ${social.following?.length || 0}</p>

  <h2>Subscriptions & Payments</h2>
  <p>Active Subscriptions: ${subscriptions.subscriptions?.filter(s => s.status === 'active').length || 0}</p>
  <p>Total Payments: ${subscriptions.payments?.length || 0}</p>

  <h2>Messages (${messages.messages?.length || 0})</h2>
  ${messages.messages?.map(m => `<div><strong>${m.fromUserId === user.id ? 'You' : 'Them'}:</strong> ${m.content || ''} - ${m.createdAt}</div>`).join('<hr>') || '<p>No messages</p>'}

  <h2>Login History (${loginHistory.loginHistory?.length || 0})</h2>
  <table><tr><th>Timestamp</th><th>IP</th><th>Country</th><th>User Agent</th></tr>
    ${loginHistory.loginHistory?.map(lh => `<tr><td>${lh.timestamp}</td><td>${lh.ip}</td><td>${lh.country || ''}</td><td>${lh.userAgent || ''}</td></tr>`).join('') || '<tr><td colspan="4">No history</td></tr>'}
  </table>

  <div class="footer">
    <p>This is an automated export of your STEEZE data. For questions, contact support@steeze.com.</p>
    <p>© ${new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio</p>
  </div>
</body>
</html>
  `;
}

// Create ZIP archive
async function createZipArchive(data, user) {
  const timestamp = Date.now();
  const exportDir = path.join(__dirname, '../../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const zipPath = path.join(exportDir, `steeze-export-${user.id}-${timestamp}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);

    // Add JSON files for each data category
    for (const [key, value] of Object.entries(data)) {
      archive.append(JSON.stringify(value, null, 2), { name: `${key}.json` });
    }

    // Add HTML report
    const htmlReport = generateHtmlReport(data, user);
    archive.append(htmlReport, { name: 'report.html' });

    archive.finalize();
  });
}

// Upload to R2 and return URL
async function uploadExportToR2(zipPath, userId) {
  const fileContent = fs.readFileSync(zipPath);
  const timestamp = Date.now();
  const key = `exports/${userId}/${timestamp}.zip`;
  const url = await uploadFile(key, fileContent, 'application/zip');
  return url;
}

// Main export processing function
export async function processDataExport(requestId) {
  const request = await prisma.dataExportRequest.findUnique({
    where: { id: requestId },
    include: { user: true }
  });

  if (!request) return;

  await prisma.dataExportRequest.update({
    where: { id: requestId },
    data: { status: 'processing' }
  });

  try {
    const { user, dataTypes } = request;
    const types = Array.isArray(dataTypes) ? dataTypes : [];
    const exportData = {};

    if (types.includes('profile')) exportData.profile = await exportProfile(user);
    if (types.includes('posts')) exportData.posts = await exportPosts(user.id);
    if (types.includes('interactions')) exportData.interactions = await exportInteractions(user.id);
    if (types.includes('social')) exportData.social = await exportSocial(user.id);
    if (types.includes('subscriptions')) exportData.subscriptions = await exportSubscriptions(user.id);
    if (types.includes('messages')) exportData.messages = await exportMessages(user.id);
    if (types.includes('login_history')) exportData.loginHistory = await exportLoginHistory(user.id);

    // Create and upload ZIP
    const zipPath = await createZipArchive(exportData, user);
    const fileSize = fs.statSync(zipPath).size;

    // Upload to Cloudflare R2
    let fileUrl;
    try {
      fileUrl = await uploadExportToR2(zipPath, user.id);
    } catch (r2Error) {
      console.error('R2 upload failed, falling back to local storage:', r2Error.message);
      // Fallback: serve locally if R2 fails
      const relativePath = path.relative(path.join(__dirname, '../..'), zipPath);
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/${relativePath}`;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        fileUrl,
        fileSize,
        expiresAt,
        completedAt: new Date()
      }
    });

    // Send email notification
    try {
      await transporter.sendMail({
        from: `"STEEZE Data" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Your STEEZE data export is ready',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #FFD700; margin: 0;">STEEZE</h1>
            </div>
            <h2 style="color: #FFD700;">Your data export is ready</h2>
            <p style="color: #ccc;">Dear ${user.username || user.email},</p>
            <p style="color: #ccc;">Your STEEZE data export has been completed and is ready for download.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${fileUrl}" style="background: #FFD700; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 24px; font-weight: bold; display: inline-block;">Download Your Data</a>
            </div>
            <p style="color: #888; font-size: 13px;">This download link will expire in 7 days (${expiresAt.toLocaleDateString()}). For security, do not share this link with anyone.</p>
            <p style="color: #888; font-size: 13px;">If you didn't request this export, please contact <a href="mailto:support@steeze.com" style="color: #FFD700;">support@steeze.com</a> immediately.</p>
            <hr style="border-color: #333; margin: 20px 0;">
            <p style="color: #555; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send export notification email:', emailError.message);
    }

    // Clean up local file after successful upload
    try {
      fs.unlinkSync(zipPath);
    } catch (cleanupError) {
      console.error('Failed to clean up local export file:', cleanupError.message);
    }
  } catch (error) {
    console.error('Export processing failed:', error);
    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'failed' }
    });
  }
}

export default { processDataExport };