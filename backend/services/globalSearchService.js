import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Search users by email, username, or artist name
async function searchUsers(query, limit = 10) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { artistName: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true,
      artistName: true,
      role: true,
      userType: true,
      isVerified: true,
      verificationStatus: true,
      profilePicUrl: true,
      createdAt: true
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return users.map(user => ({
    id: user.id,
    type: 'user',
    title: user.artistName || user.username || user.email,
    subtitle: user.email,
    badge: user.role,
    avatar: user.profilePicUrl,
    url: `/admin/users/${user.id}`,
    metadata: {
      role: user.role,
      userType: user.userType,
      verified: user.isVerified,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt
    }
  }));
}

// Search content (posts)
async function searchContent(query, limit = 10) {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      creator: {
        select: { id: true, email: true, username: true, artistName: true }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return posts.map(post => ({
    id: post.id,
    type: post.type === 'video' ? 'video' : post.type === 'song' ? 'song' : 'post',
    title: post.title || 'Untitled',
    subtitle: `By ${post.creator?.artistName || post.creator?.username || post.creator?.email}`,
    badge: post.status || post.adminStatus,
    url: `/admin/content/${post.id}`,
    metadata: {
      type: post.type,
      status: post.status,
      adminStatus: post.adminStatus,
      views: post.views,
      likes: post.likes,
      createdAt: post.createdAt,
      creator: {
        id: post.creator?.id,
        name: post.creator?.artistName || post.creator?.username
      }
    }
  }));
}

// Search reports
async function searchReports(query, limit = 10) {
  const reports = await prisma.report.findMany({
    where: {
      OR: [
        { id: { contains: query, mode: 'insensitive' } },
        { reason: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      reporter: { select: { id: true, email: true, username: true } },
      reported: { select: { id: true, email: true, username: true } }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return reports.map(report => ({
    id: report.id,
    type: 'report',
    title: `Report #${report.id.slice(0, 8)}`,
    subtitle: `${report.reason} - Reported by ${report.reporter?.email}`,
    badge: report.status,
    url: `/admin/reports/${report.id}`,
    metadata: {
      reason: report.reason,
      status: report.status,
      severity: report.severity,
      createdAt: report.createdAt,
      reporter: report.reporter?.email,
      reported: report.reported?.email
    }
  }));
}

// Search support tickets
async function searchTickets(query, limit = 10) {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      OR: [
        { ticketNumber: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { userEmail: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      ticketUser: { select: { id: true, email: true, username: true } },
      assignee: { select: { id: true, email: true, username: true } }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return tickets.map(ticket => ({
    id: ticket.id,
    type: 'ticket',
    title: `${ticket.ticketNumber} - ${ticket.subject}`,
    subtitle: `From: ${ticket.userEmail} | Category: ${ticket.category}`,
    badge: ticket.status,
    url: `/admin/tickets/${ticket.id}`,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      assignedTo: ticket.assignee?.email
    }
  }));
}

// Search payments
async function searchPayments(query, limit = 10) {
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { id: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } }
      ]
    },
    include: {
      user: { select: { id: true, email: true, username: true } }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  return payments.map(payment => ({
    id: payment.id,
    type: 'payment',
    title: `Payment #${payment.id.slice(0, 8)}`,
    subtitle: `${payment.amount} - ${payment.user?.email}`,
    badge: payment.status,
    url: `/admin/payments/${payment.id}`,
    metadata: {
      amount: payment.amount,
      tier: payment.tier,
      status: payment.status,
      createdAt: payment.createdAt
    }
  }));
}

// Search verification requests
async function searchVerifications(query, limit = 10) {
  const verifications = await prisma.user.findMany({
    where: {
      verificationStatus: { not: 'approved' },
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { artistName: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true,
      artistName: true,
      verificationStatus: true,
      idPhotoUrl: true,
      selfiePhotoUrl: true,
      createdAt: true
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return verifications.map(verification => ({
    id: verification.id,
    type: 'verification',
    title: verification.artistName || verification.username || verification.email,
    subtitle: `Status: ${verification.verificationStatus}`,
    badge: verification.verificationStatus,
    url: `/admin/verification/${verification.id}`,
    metadata: {
      verificationStatus: verification.verificationStatus,
      hasIdPhoto: !!verification.idPhotoUrl,
      hasSelfie: !!verification.selfiePhotoUrl,
      createdAt: verification.createdAt
    }
  }));
}

// Log search query
async function logSearch(query, userId, resultCount, entityType = 'all') {
  await prisma.searchLog.create({
    data: {
      query,
      userId,
      resultCount,
      entityType
    }
  });
}

// Get recent searches
async function getRecentSearches(userId, limit = 10) {
  const searches = await prisma.searchLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    distinct: ['query'],
    take: limit
  });
  return searches.map(s => s.query);
}

// Get search analytics
async function getSearchAnalytics(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [totalSearches, topQueries, searchesByType] = await Promise.all([
    prisma.searchLog.count({ where: { createdAt: { gte: startDate } } }),
    prisma.searchLog.groupBy({
      by: ['query'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { query: 'desc' } },
      take: 10
    }),
    prisma.searchLog.groupBy({
      by: ['entityType'],
      where: { createdAt: { gte: startDate } },
      _count: true
    })
  ]);
  
  return {
    totalSearches,
    topQueries: topQueries.map(q => ({ query: q.query, count: q._count })),
    searchesByType,
    period: `${days} days`
  };
}

// Main search function
export async function globalSearch(query, userId, entityType = 'all', limit = 10) {
  if (!query || query.length < 2) {
    return { success: false, message: 'Query must be at least 2 characters' };
  }
  
  const results = {};
  let totalCount = 0;
  
  if (entityType === 'all' || entityType === 'users') {
    results.users = await searchUsers(query, limit);
    totalCount += results.users.length;
  }
  
  if (entityType === 'all' || entityType === 'content') {
    results.content = await searchContent(query, limit);
    totalCount += results.content.length;
  }
  
  if (entityType === 'all' || entityType === 'reports') {
    results.reports = await searchReports(query, limit);
    totalCount += results.reports.length;
  }
  
  if (entityType === 'all' || entityType === 'tickets') {
    results.tickets = await searchTickets(query, limit);
    totalCount += results.tickets.length;
  }
  
  if (entityType === 'all' || entityType === 'payments') {
    results.payments = await searchPayments(query, limit);
    totalCount += results.payments.length;
  }
  
  if (entityType === 'all' || entityType === 'verifications') {
    results.verifications = await searchVerifications(query, limit);
    totalCount += results.verifications.length;
  }
  
  // Log the search
  await logSearch(query, userId, totalCount, entityType);
  
  return {
    success: true,
    query,
    results,
    total: totalCount,
    entityType
  };
}

// Type-specific search exports
export const searchUsersOnly = (query, limit) => searchUsers(query, limit);
export const searchContentOnly = (query, limit) => searchContent(query, limit);
export const searchReportsOnly = (query, limit) => searchReports(query, limit);
export const searchTicketsOnly = (query, limit) => searchTickets(query, limit);
export const searchPaymentsOnly = (query, limit) => searchPayments(query, limit);
export const searchVerificationsOnly = (query, limit) => searchVerifications(query, limit);
export { getRecentSearches, getSearchAnalytics, logSearch };