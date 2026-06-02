import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get available templates list
router.get('/templates', authenticateToken, async (req, res) => {
  const templates = [
    { id: 'icon', name: 'ICON STEEZE', description: 'Classic Luxury / Entertainment Industry Standard', primaryColor: '#D4AF37' },
    { id: 'rebel', name: 'REBEL STEEZE', description: 'Muscular Bold / Dark Edgy - Hip-hop/Rock', primaryColor: '#D32F2F' },
    { id: 'diva', name: 'DIVA STEEZE', description: 'Feminine Elegant / Rose Gold - Pop/R&B', primaryColor: '#E8A2B4' },
    { id: 'luminary', name: 'THE LUMINARY', description: 'Glossy Black/Purple - Electronic/Alternative', primaryColor: '#5E2BFF' },
    { id: 'visionary', name: 'THE VISIONARY', description: 'Golden Yellow/Black - Established Artists', primaryColor: '#FFD700' },
    { id: 'pure', name: 'THE PURE', description: 'Glossy White Minimal - Singer-songwriter/Acoustic', primaryColor: '#1A1A1A' },
    { id: 'spectrum', name: 'THE SPECTRUM', description: 'Full Color Rainbow - Pop/Multi-genre', primaryColor: 'rainbow' }
  ];
  res.json({ success: true, templates });
});

// Get current user's template
router.get('/user/template', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { templateId: true }
    });
    res.json({ success: true, templateId: user?.templateId || 'icon' });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Update user's template
router.put('/user/template', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.body;
    
    const validTemplates = ['icon', 'rebel', 'diva', 'luminary', 'visionary', 'pure', 'spectrum'];
    if (!validTemplates.includes(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { templateId }
    });
    
    res.json({ success: true, templateId: updatedUser.templateId });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

export default router;