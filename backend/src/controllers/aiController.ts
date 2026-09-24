import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateAIGuidance, askAIService } from '../ai/aiService';
import { solveMultimodalQuestion } from '../ai/multimodalSolver';
import { removeQueryFile } from '../services/fileStorage';

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

export const askMultimodal = async (req: AuthenticatedRequest, res: Response) => {
  const uploadedFile = req.file;
  try {
    const userId = req.user?.id;
    if (!userId) {
      if (uploadedFile?.path) removeQueryFile(uploadedFile.path);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { question, language, lang, mode = 'text', standard } = req.body;
    const selectedLang = language || lang || 'en';

    if (!question && !uploadedFile) {
      return res.status(400).json({ error: 'Please provide a question, voice recording, or upload an image.' });
    }

    const result = await solveMultimodalQuestion({
      userId,
      question: question || '',
      imagePath: uploadedFile?.path,
      mode: (mode as any) || (uploadedFile ? 'image' : 'text'),
      language: selectedLang,
      standard: standard || (req.user as any)?.standard || 'Standard 8'
    });

    // Clean up temporary query file from disk after successful processing
    if (uploadedFile?.path) {
      removeQueryFile(uploadedFile.path);
    }

    res.json({
      success: true,
      mode: mode || (uploadedFile ? 'image' : 'text'),
      result
    });
  } catch (error: any) {
    if (uploadedFile?.path) {
      removeQueryFile(uploadedFile.path);
    }
    console.error('askMultimodal error:', error);
    res.status(500).json({ error: 'Failed to process question. Please try again.' });
  }
};
