import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import {
  createTicket,
  assignTicket,
  updateTicketStatus,
  addTicketMessage,
  getTicketWithMessages,
  getUserTickets,
  getTicketDashboardStats,
  updateTicketAnalytics
} from '../../services/ticketService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ TICKET MANAGEMENT ============

// GET /api/admin/tickets - List all tickets
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, category, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          ticketUser: { select: { id: true, email: true, username: true } },
          assignee: { select: { id: true, email: true, username: true } }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);
    
    res.json({ success: true, tickets, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// GET /api/admin/tickets/:id - Get single ticket with messages

// POST /api/admin/tickets - Create new ticket
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, userEmail, category, subject, description, priority } = req.body;
    
    if (!userEmail || !category || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const ticket = await createTicket(userId, userEmail, category, subject, description, priority);
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
});

// PUT /api/admin/tickets/:id/assign - Assign ticket to admin
router.put('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToName } = req.body;
    const adminId = req.user.id;
    
    const ticket = await assignTicket(id, assignedTo || adminId, assignedToName || req.user.email);
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign ticket' });
  }
});

// PUT /api/admin/tickets/:id/status - Update ticket status
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const adminId = req.user.id;
    
    const ticket = await updateTicketStatus(id, status, adminId, resolution);
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket status' });
  }
});

// POST /api/admin/tickets/:id/messages - Add message to ticket
router.post('/:id/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal, attachments } = req.body;
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const ticketMessage = await addTicketMessage(
      id, adminId, adminEmail, 'admin', message, isInternal || false, attachments
    );
    
    res.json({ success: true, message: ticketMessage });
  } catch (error) {
    console.error('Add ticket message error:', error);
    res.status(500).json({ success: false, message: 'Failed to add message' });
  }
});

// ============ TICKET ANALYTICS ============

// GET /api/admin/tickets/dashboard/stats - Dashboard stats
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getTicketDashboardStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket stats' });
  }
});

// GET /api/admin/tickets/analytics - Get ticket analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const analytics = await prisma.ticketAnalytics.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
    
    res.json({ success: true, analytics, days: parseInt(days) });
  } catch (error) {
    console.error('Get ticket analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket analytics' });
  }
});

// POST /api/admin/tickets/analytics/refresh - Refresh today's analytics
router.post('/analytics/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analytics = await updateTicketAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh analytics' });
  }
});

// GET /api/admin/tickets/categories - Get all ticket categories
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  const categories = [
    { value: 'verification_review', label: 'Verification Review' },
    { value: 'fraud_investigation', label: 'Fraud Investigation' },
    { value: 'creator_dispute', label: 'Creator Dispute' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'legal_request', label: 'Legal Request' },
    { value: 'security_incident', label: 'Security Incident' }
  ];
  res.json({ success: true, categories });
});

// GET /api/admin/tickets/priorities - Get priority options
router.get('/priorities', authenticateToken, requireAdmin, async (req, res) => {
  const priorities = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];
  res.json({ success: true, priorities });
});

export default router;
// GET /api/admin/tickets/:id - Get single ticket with messages
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await getTicketWithMessages(id);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
});
