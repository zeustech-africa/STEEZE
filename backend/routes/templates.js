import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Predefined templates (5 designs)
const TEMPLATES = [
  { id: "classic", name: "Classic", description: "Elegant, timeless design with gold accents", primaryColor: "#FFD700" },
  { id: "premium", name: "Premium", description: "Luxurious, high-end layout with bold styling", primaryColor: "#FFD700" },
  { id: "feminine", name: "Feminine", description: "Soft, graceful design with pastel accents", primaryColor: "#FF69B4" },
  { id: "muscular", name: "Muscular", description: "Bold, urban style with strong visual impact", primaryColor: "#00A3FF" },
  { id: "minimal", name: "Minimal", description: "Clean, modern design with white space", primaryColor: "#FFFFFF" },
];

// GET all available templates
router.get('/templates', async (req, res) => {
  res.json({ success: true, templates: TEMPLATES });
});

// GET current user's template
router.get('/user/template', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { templateId: true }
    });
    res.json({ success: true, templateId: user?.templateId || "classic" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// UPDATE user's template
router.put('/user/template', async (req, res) => {
  const { templateId } = req.body;
  
  // Validate template exists
  const templateExists = TEMPLATES.some(t => t.id === templateId);
  if (!templateExists) {
    return res.status(400).json({ error: "Invalid template" });
  }
  
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { templateId }
    });
    res.json({ success: true, templateId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

export default router;
