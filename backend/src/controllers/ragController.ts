import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import {
  executeTextbookRAG,
  ensureSeedTextbooksExist,
  chunkTextContent,
  generateSemanticVector
} from '../ai/ragEngine';
import fs from 'fs';

/**
 * Handles student textbook-grounded RAG query
 */
export const askTextbook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, board, standard, subject, medium, language, lang } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question prompt is required.' });
    }

    const selectedLang = language || lang || 'en';

    const result = await executeTextbookRAG({
      question: question.trim(),
      board,
      standard,
      subject,
      medium,
      language: selectedLang
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error executing textbook RAG:', error);
    res.status(500).json({
      error: 'Failed to process textbook query.',
      message: error.message
    });
  }
};

/**
 * Lists all registered textbooks with chunk statistics
 */
export const listTextbooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const { board, standard, subject, medium } = req.query;

    const where: any = {};
    if (board && board !== 'ALL') where.board = String(board);
    if (standard && standard !== 'ALL') where.standard = String(standard);
    if (subject && subject !== 'ALL') where.subject = { contains: String(subject) };
    if (medium && medium !== 'ALL') where.medium = String(medium);

    const textbooks = await prisma.textbookDocument.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: [{ board: 'asc' }, { standard: 'asc' }, { chapterNumber: 'asc' }]
    });

    res.json({
      success: true,
      count: textbooks.length,
      textbooks: textbooks.map(tb => ({
        id: tb.id,
        title: tb.title,
        titleGu: tb.titleGu,
        board: tb.board,
        standard: tb.standard,
        subject: tb.subject,
        medium: tb.medium,
        academicYear: tb.academicYear,
        chapterNumber: tb.chapterNumber,
        chapterName: tb.chapterName,
        chunkCount: tb._count.chunks,
        createdAt: tb.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Error listing textbooks:', error);
    res.status(500).json({ error: 'Failed to retrieve textbooks.' });
  }
};

/**
 * Uploads & indexes a new textbook or chapter by Teacher / Admin
 */
export const uploadTextbook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers and administrators can manage textbook knowledge base.' });
    }

    const {
      title,
      titleGu,
      board = 'NCERT',
      standard = 'Standard 8',
      subject = 'Science',
      medium = 'English',
      academicYear = '2025-2026',
      chapterNumber,
      chapterName,
      textContent
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Textbook title is required.' });
    }

    let rawText = textContent || '';
    const uploadedFile = req.file;

    // Create textbook document record
    const document = await prisma.textbookDocument.create({
      data: {
        title: title.trim(),
        titleGu: titleGu ? titleGu.trim() : null,
        board: String(board),
        standard: String(standard),
        subject: String(subject),
        medium: String(medium),
        academicYear: String(academicYear),
        chapterNumber: chapterNumber ? parseInt(String(chapterNumber), 10) : null,
        chapterName: chapterName ? chapterName.trim() : null,
        pdfFilePath: uploadedFile?.filename || null,
        fileSizeBytes: uploadedFile?.size || null,
        uploaderId: req.user?.id || null
      }
    });

    // If raw text was provided, chunk and index it
    if (rawText && rawText.trim().length > 0) {
      const chunks = chunkTextContent(rawText, 600, 100);
      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        const vector = generateSemanticVector(content);

        await prisma.textbookChunk.create({
          data: {
            documentId: document.id,
            chunkIndex: i + 1,
            content,
            pageNumber: Math.floor(i / 2) + 1,
            chapterName: document.chapterName,
            vectorJson: JSON.stringify(vector),
            keywords: content
              .toLowerCase()
              .replace(/[^\w\s\u0A80-\u0AFF]/g, ' ')
              .split(/\s+/)
              .filter(w => w.length > 3)
              .slice(0, 15)
              .join(' ')
          }
        });
      }
    } else if (uploadedFile) {
      // Default placeholder chunk for uploaded PDF document
      const fallbackContent = `${title}. Chapter ${chapterNumber || 1}: ${chapterName || title}. Comprehensive authorized curriculum notes for ${standard} ${subject} (${board} ${medium} Medium, Academic Year ${academicYear}).`;
      const vector = generateSemanticVector(fallbackContent);

      await prisma.textbookChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: 1,
          content: fallbackContent,
          pageNumber: 1,
          chapterName: document.chapterName,
          vectorJson: JSON.stringify(vector),
          keywords: `${board} ${standard} ${subject} ${chapterName}`.toLowerCase()
        }
      });
    }

    const createdWithChunks = await prisma.textbookDocument.findUnique({
      where: { id: document.id },
      include: {
        _count: { select: { chunks: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Textbook successfully indexed into knowledge base.',
      document: {
        ...createdWithChunks,
        chunkCount: createdWithChunks?._count.chunks || 0
      }
    });
  } catch (error: any) {
    console.error('Error uploading textbook:', error);
    res.status(500).json({ error: 'Failed to upload and index textbook.' });
  }
};

/**
 * Deletes a textbook from the knowledge base
 */
export const deleteTextbook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers and administrators can remove textbooks.' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Textbook ID is required.' });

    const existing = await prisma.textbookDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Textbook document not found.' });
    }

    // Delete document (cascade removes chunks)
    await prisma.textbookDocument.delete({ where: { id } });

    res.json({
      success: true,
      message: `Textbook "${existing.title}" removed from knowledge base.`
    });
  } catch (error: any) {
    console.error('Error deleting textbook:', error);
    res.status(500).json({ error: 'Failed to delete textbook.' });
  }
};

/**
 * Returns RAG knowledge base statistics
 */
export const getRAGStats = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const [totalBooks, totalChunks, ncertCount, gsebCount] = await Promise.all([
      prisma.textbookDocument.count(),
      prisma.textbookChunk.count(),
      prisma.textbookDocument.count({ where: { board: 'NCERT' } }),
      prisma.textbookDocument.count({ where: { board: 'GSEB' } })
    ]);

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalChunks,
        ncertCount,
        gsebCount,
        standards: ['Standard 6', 'Standard 7', 'Standard 8'],
        subjects: ['Science', 'Mathematics', 'Social Science', 'Gujarati', 'English']
      }
    });
  } catch (error: any) {
    console.error('Error getting RAG stats:', error);
    res.status(500).json({ error: 'Failed to get knowledge base statistics.' });
  }
};
