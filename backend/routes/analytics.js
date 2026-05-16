import express from 'express';
import { getCreatorAnalytics, getTopCreatorPosts, getPlatformAnalytics, getAudienceDemographics, generatePDFReport } from '../services/analytics.js';

const router = express.Router();

// Get creator analytics
router.get('/creator', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const creatorId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const analytics = await getCreatorAnalytics(creatorId, startDate, endDate, groupBy);
    const topPosts = await getTopCreatorPosts(creatorId, 10);
    const demographics = await getAudienceDemographics(creatorId);

    res.json({
      success: true,
      analytics,
      topPosts,
      demographics,
    });
  } catch (error) {
    console.error('Creator analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Get platform analytics (admin only)
router.get('/platform', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const analytics = await getPlatformAnalytics(startDate, endDate, groupBy);

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform analytics' });
  }
});

// Export analytics as CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { startDate, endDate, type = 'creator' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    let data;
    if (type === 'platform') {
      data = await getPlatformAnalytics(startDate, endDate);
    } else {
      data = await getCreatorAnalytics(req.user.id, startDate, endDate);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data available for export' });
    }

    // Build CSV manually to avoid json2csv dependency issues
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      });
      csvLines.push(values.join(','));
    }

    const csv = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

// Export analytics as PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const { startDate, endDate, type = 'creator' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    let data;
    if (type === 'platform') {
      data = await getPlatformAnalytics(startDate, endDate);
    } else {
      data = await getCreatorAnalytics(req.user.id, startDate, endDate);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data available for export' });
    }

    const pdfBuffer = await generatePDFReport(data, startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export PDF' });
  }
});

// Get top posts (standalone endpoint)
router.get('/top-posts', async (req, res) => {
  try {
    const creatorId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const topPosts = await getTopCreatorPosts(creatorId, limit);

    res.json({ success: true, topPosts });
  } catch (error) {
    console.error('Top posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top posts' });
  }
});

// Get demographics (standalone endpoint)
router.get('/demographics', async (req, res) => {
  try {
    const creatorId = req.user.id;
    const demographics = await getAudienceDemographics(creatorId);

    res.json({ success: true, demographics });
  } catch (error) {
    console.error('Demographics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch demographics' });
  }
});

export default router;