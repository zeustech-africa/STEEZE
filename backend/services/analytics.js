import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Get creator analytics with date range
export async function getCreatorAnalytics(creatorId, startDate, endDate, groupBy = 'day') {
  const where = {
    creatorId,
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  const analytics = await prisma.creatorAnalytics.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return aggregateAnalytics(analytics, groupBy, [
    'views', 'likes', 'comments', 'reposts', 'saves', 'followersGain', 'revenue',
  ]);
}

// Get creator top posts
export async function getTopCreatorPosts(creatorId, limit = 10) {
  const posts = await prisma.post.findMany({
    where: { creatorId, adminStatus: 'approved_global' },
    include: {
      contentAnalytics: true,
      _count: {
        select: {
          interactions: { where: { type: 'like' } },
          comments: true,
          reposts: true,
        },
      },
    },
    orderBy: {
      contentAnalytics: { views: 'desc' },
    },
    take: limit,
  });

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    type: post.type,
    thumbnail: post.thumbnailUrl,
    createdAt: post.createdAt,
    views: post.contentAnalytics?.views || 0,
    likes: post._count.interactions,
    comments: post._count.comments,
    reposts: post._count.reposts,
    saves: post.contentAnalytics?.saves || 0,
    revenue: post.isFree ? 0 : (post.price || 0) * (post.contentAnalytics?.saves || 0),
  }));
}

// Get platform analytics (admin)
export async function getPlatformAnalytics(startDate, endDate, groupBy = 'day') {
  const where = {
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  const analytics = await prisma.dailyAnalytics.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return aggregateAnalytics(analytics, groupBy, [
    'totalUsers', 'totalCreators', 'totalVibes', 'totalPosts', 'totalViews',
    'totalLikes', 'totalComments', 'totalReposts', 'totalSaves',
    'totalRevenue', 'platformRevenue', 'creatorPayouts',
  ]);
}

// Get audience demographics
export async function getAudienceDemographics(creatorId) {
  const followers = await prisma.follow.findMany({
    where: { followingId: creatorId },
    include: {
      follower: {
        select: {
          birthDate: true,
          country: true,
          userAgent: true,
        },
      },
    },
  });

  const demographics = {
    age: { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 },
    location: {},
    device: { mobile: 0, desktop: 0, tablet: 0 },
  };

  for (const follow of followers) {
    const age = calculateAge(follow.follower.birthDate);
    if (age >= 13 && age <= 17) demographics.age['13-17']++;
    else if (age >= 18 && age <= 24) demographics.age['18-24']++;
    else if (age >= 25 && age <= 34) demographics.age['25-34']++;
    else if (age >= 35 && age <= 44) demographics.age['35-44']++;
    else if (age >= 45) demographics.age['45+']++;

    if (follow.follower.country) {
      demographics.location[follow.follower.country] = (demographics.location[follow.follower.country] || 0) + 1;
    }

    const ua = follow.follower.userAgent || '';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
      demographics.device.mobile++;
    } else if (ua.includes('Tablet') || ua.includes('iPad')) {
      demographics.device.tablet++;
    } else {
      demographics.device.desktop++;
    }
  }

  // Sort location by count and limit to top 10
  const sortedLocation = Object.fromEntries(
    Object.entries(demographics.location)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );
  demographics.location = sortedLocation;

  return demographics;
}

// Aggregate analytics by time period
function aggregateAnalytics(data, groupBy, fields) {
  const grouped = {};
  for (const item of data) {
    let key;
    const date = new Date(item.date);
    if (groupBy === 'week') {
      const week = getWeekNumber(date);
      key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = { date: key };
      for (const field of fields) {
        grouped[key][field] = 0;
      }
    }
    for (const field of fields) {
      grouped[key][field] += (item[field] || 0);
    }
  }

  return Object.values(grouped);
}

// Calculate age from birth date
function calculateAge(birthDate) {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Get ISO week number
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// Generate daily analytics (cron job)
export async function generateDailyAnalytics() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Check if already generated
  const existing = await prisma.dailyAnalytics.findUnique({
    where: { date: yesterday },
  });
  if (existing) {
    console.log(`Daily analytics for ${yesterday.toISOString().split('T')[0]} already exists, skipping.`);
    return;
  }

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalCreators,
    totalVibes,
    totalPosts,
    totalViews,
    totalLikes,
    totalComments,
    totalReposts,
    totalSaves,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { userType: { in: ['zls_artist', 'independent_creator'] } } }),
    prisma.user.count({ where: { userType: 'vibe' } }),
    prisma.post.count({
      where: { createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.postInteraction.count({
      where: { type: 'view', createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.postInteraction.count({
      where: { type: 'like', createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.comment.count({
      where: { createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.repost.count({
      where: { createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.postInteraction.count({
      where: { type: 'save', createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: yesterday, lte: endOfYesterday } },
      _sum: { amount: true },
    }),
  ]);

  const platformRevenue = (totalRevenue._sum.amount || 0) * 0.3; // 30% platform cut
  const creatorPayouts = (totalRevenue._sum.amount || 0) * 0.7; // 70% to creators

  await prisma.dailyAnalytics.create({
    data: {
      date: yesterday,
      totalUsers,
      totalCreators,
      totalVibes,
      totalPosts,
      totalViews,
      totalLikes,
      totalComments,
      totalReposts,
      totalSaves,
      totalRevenue: totalRevenue._sum.amount || 0,
      platformRevenue,
      creatorPayouts,
    },
  });

  console.log(`Daily analytics generated for ${yesterday.toISOString().split('T')[0]}`);
}

// Generate PDF report
export async function generatePDFReport(data, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];

  return new Promise((resolve, reject) => {
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('STEEZE Analytics Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Report Period: ${startDate} to ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Summary stats
    if (data.length > 0) {
      const totals = data.reduce((acc, row) => {
        for (const key of Object.keys(row)) {
          if (key !== 'date' && typeof row[key] === 'number') {
            acc[key] = (acc[key] || 0) + row[key];
          }
        }
        return acc;
      }, {});

      doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      for (const [key, value] of Object.entries(totals)) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        doc.text(`${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
      }
      doc.moveDown();

      // Data table
      doc.fontSize(14).font('Helvetica-Bold').text('Daily Breakdown', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica');

      const headers = Object.keys(data[0]);
      const colWidth = (doc.page.width - 100) / headers.length;

      // Header row
      let x = 50;
      for (const header of headers) {
        doc.text(header.replace(/([A-Z])/g, ' $1').trim(), x, doc.y, { width: colWidth, align: 'left' });
        x += colWidth;
      }
      doc.moveDown(0.5);

      // Data rows
      for (const row of data) {
        x = 50;
        for (const header of headers) {
          const val = row[header];
          const displayVal = typeof val === 'number' ? val.toLocaleString() : String(val || '');
          doc.text(displayVal, x, doc.y, { width: colWidth, align: 'left' });
          x += colWidth;
        }
        doc.moveDown(0.3);

        // New page if near bottom
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
      }
    }

    doc.end();
  });
}

export default {
  getCreatorAnalytics,
  getTopCreatorPosts,
  getPlatformAnalytics,
  getAudienceDemographics,
  generateDailyAnalytics,
  generatePDFReport,
};