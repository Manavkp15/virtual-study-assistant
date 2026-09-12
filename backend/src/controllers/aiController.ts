import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateAIGuidance, askAIService } from '../ai/aiService';

export const getGuidance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const lang = (req.query.lang as string) || (req.query.language as string) || 'en';
    const guidance = await generateAIGuidance(userId, lang);
    res.json({ guidance });
  } catch (error: any) {
    console.error('getGuidance error:', error);
    res.status(500).json({ error: 'Failed to generate AI guidance' });
  }
};

export const askAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { question, language, lang } = req.body;
    if (!question) return res.status(400).json({ error: 'Question prompt is required' });

    const selectedLang = language || lang || 'en';
    const answer = await askAIService(userId, question, selectedLang);
    res.json({ question, answer });
  } catch (error: any) {
    console.error('askAI error:', error);
    res.status(500).json({ error: 'Failed to process AI query' });
  }
};
