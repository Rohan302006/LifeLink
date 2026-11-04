import { Router, Request, Response } from 'express';
import { parseEmergencyIntake, getAiAssistantResponse } from '../services/geminiService.js';

const router = Router();

// 1. Emergency Free-Text/Voice Intake -> Structured Request Draft
router.post('/intake', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text prompt required for emergency intake' });
    }

    const draft = await parseEmergencyIntake(text, language || 'en');
    res.json({
      success: true,
      draft,
      guidance: 'Review and confirm this draft. Final request must be medically verified by the hospital doctor.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Multilingual FAQ and Guidance Assistant (EN, HI, MR)
router.post('/faq', async (req: Request, res: Response) => {
  try {
    const { query, language } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string required' });
    }

    const result = await getAiAssistantResponse(query, language || 'en');
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
