import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate ticket number (e.g., TKT-20241205-001)
async function generateTicketNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.supportTicket.count({
    where: {
      createdAt: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      }
    }
  });
  return `TKT-${dateStr}-${String(count + 1).padStart(3, '0')}`;
}

// Create a new ticket
export async function createTicket(userId, userEmail, category, subject, description, priority = 'normal') {
  const ticketNumber = await generateTicketNumber();
  
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId,
      userEmail,
      category,
      subject,
      description,
      priority,
      status: 'open'
    }
  });
  
  return ticket;
}

// Assign ticket to admin/moderator
export async function assignTicket(ticketId, assignedTo, assignedToName) {
  return await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedTo,
      assignedToName,
      status: 'in_progress',
      updatedAt: new Date()
    }
  });
}

// Update ticket status
export async function updateTicketStatus(ticketId, status, resolvedBy = null, resolution = null) {
  const data = { status, updatedAt: new Date() };
  
  if (status === 'resolved') {
    data.resolvedAt = new Date();
    data.resolvedBy = resolvedBy;
    data.resolution = resolution;
  } else if (status === 'closed') {
    data.closedAt = new Date();
    data.closedBy = resolvedBy;
    data.closedReason = resolution;
  }
  
  return await prisma.supportTicket.update({
    where: { id: ticketId },
    data
  });
}

// Add message to ticket
export async function addTicketMessage(ticketId, authorId, authorName, authorRole, message, isInternal = false, attachments = null) {
  const ticketMessage = await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId,
      authorName,
      authorRole,
      message,
      isInternal,
      attachments
    }
  });
  
  // Update ticket updatedAt
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });
  
  return ticketMessage;
}

// Get ticket with messages
export async function getTicketWithMessages(ticketId) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  return ticket;
}

// Get tickets by user
export async function getUserTickets(userId) {
  return await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

// Get dashboard stats
export async function getTicketDashboardStats() {
  const [open, inProgress, pendingInfo, resolved, closed, total] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'open' } }),
    prisma.supportTicket.count({ where: { status: 'in_progress' } }),
    prisma.supportTicket.count({ where: { status: 'pending_info' } }),
    prisma.supportTicket.count({ where: { status: 'resolved' } }),
    prisma.supportTicket.count({ where: { status: 'closed' } }),
    prisma.supportTicket.count()
  ]);
  
  const byCategory = await prisma.supportTicket.groupBy({
    by: ['category'],
    _count: true
  });
  
  const byPriority = await prisma.supportTicket.groupBy({
    by: ['priority'],
    _count: true
  });
  
  return {
    counts: { open, inProgress, pendingInfo, resolved, closed, total },
    byCategory,
    byPriority
  };
}

// Update ticket analytics (run daily)
export async function updateTicketAnalytics(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const [created, resolved, open, byCategory, byPriority] = await Promise.all([
    prisma.supportTicket.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.supportTicket.count({ where: { resolvedAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.supportTicket.count({ where: { status: { notIn: ['resolved', 'closed'] } } }),
    prisma.supportTicket.groupBy({ by: ['category'], _count: true }),
    prisma.supportTicket.groupBy({ by: ['priority'], _count: true })
  ]);
  
  await prisma.ticketAnalytics.upsert({
    where: { date: startOfDay },
    update: {
      ticketsCreated: created,
      ticketsResolved: resolved,
      ticketsOpen: open,
      byCategory,
      byPriority,
      updatedAt: new Date()
    },
    create: {
      date: startOfDay,
      ticketsCreated: created,
      ticketsResolved: resolved,
      ticketsOpen: open,
      byCategory,
      byPriority
    }
  });
  
  return { created, resolved, open };
}