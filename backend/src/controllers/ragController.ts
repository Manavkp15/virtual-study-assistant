import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { persistFile } from '../services/fileStorage';
import {
  executeTextbookRAG,
  ensureSeedTextbooksExist,
  chunkTextContent,
  generateSemanticVector
} from '../ai/ragEngine';

/**
 * Handles student textbook-grounded RAG query
 */
export const askTextbook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      question,
      board = 'NCERT',
      standard,
      subject,
      chapter,
      topic,
      medium,
      language,
      lang,
      ncertMode = true
    } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question prompt is required.' });
    }

    const selectedLang = language || lang || 'en';

    const result = await executeTextbookRAG({
      question: question.trim(),
      board: ncertMode ? 'NCERT' : board,
      standard,
      subject,
      chapter,
      topic,
      medium,
      language: selectedLang,
      ncertMode,
      userId: req.user?.id
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
 * Lists all registered textbooks with chunk statistics & versioning
 */
export const listTextbooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const { board, standard, subject, medium, search } = req.query;

    const where: any = {};
    if (board && board !== 'ALL') where.board = String(board);
    if (standard && standard !== 'ALL') where.standard = String(standard);
    if (subject && subject !== 'ALL') where.subject = { contains: String(subject) };
    if (medium && medium !== 'ALL') where.medium = String(medium);
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { chapterName: { contains: q } },
        { topic: { contains: q } }
      ];
    }

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
        version: tb.version,
        chapterNumber: tb.chapterNumber,
        chapterName: tb.chapterName,
        topic: tb.topic,
        chunkCount: tb._count.chunks,
        createdAt: tb.createdAt,
        updatedAt: tb.updatedAt
      }))
    });
  } catch (error: any) {
    console.error('Error listing textbooks:', error);
    res.status(500).json({ error: 'Failed to retrieve textbooks.' });
  }
};

/**
 * Retrieves hierarchical taxonomy: Class -> Subject -> Chapter -> Topic
 */
export const getTaxonomy = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const documents = await prisma.textbookDocument.findMany({
      select: {
        board: true,
        standard: true,
        subject: true,
        chapterNumber: true,
        chapterName: true,
        topic: true
      },
      orderBy: [{ standard: 'asc' }, { subject: 'asc' }, { chapterNumber: 'asc' }]
    });

    // Structure taxonomy map
    const taxonomy: Record<string, Record<string, Array<{ chapterNumber: number | null; chapterName: string | null; topic: string | null }>>> = {};

    for (const doc of documents) {
      const std = doc.standard || 'General';
      const sub = doc.subject || 'General';
      if (!taxonomy[std]) taxonomy[std] = {};
      if (!taxonomy[std][sub]) taxonomy[std][sub] = [];

      taxonomy[std][sub].push({
        chapterNumber: doc.chapterNumber,
        chapterName: doc.chapterName,
        topic: doc.topic
      });
    }

    res.json({
      success: true,
      taxonomy
    });
  } catch (error: any) {
    console.error('Error getting taxonomy:', error);
    res.status(500).json({ error: 'Failed to get taxonomy.' });
  }
};

/**
 * Browse textbook content and verified chunks by Class -> Subject -> Chapter
 */
export const browseTextbookContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const { board = 'NCERT', standard, subject, chapterNumber } = req.query;

    const where: any = {};
    if (board && board !== 'ALL') where.board = String(board);
    if (standard && standard !== 'ALL') where.standard = String(standard);
    if (subject && subject !== 'ALL') where.subject = { contains: String(subject) };
    if (chapterNumber && chapterNumber !== 'ALL') where.chapterNumber = parseInt(String(chapterNumber), 10);

    const documents = await prisma.textbookDocument.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' }
        }
      },
      orderBy: [{ standard: 'asc' }, { subject: 'asc' }, { chapterNumber: 'asc' }]
    });

    res.json({
      success: true,
      count: documents.length,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        titleGu: d.titleGu,
        board: d.board,
        standard: d.standard,
        subject: d.subject,
        version: d.version,
        chapterNumber: d.chapterNumber,
        chapterName: d.chapterName,
        topic: d.topic,
        chunks: d.chunks.map(c => ({
          id: c.id,
          chunkIndex: c.chunkIndex,
          content: c.content,
          pageNumber: c.pageNumber,
          sectionName: c.sectionName,
          topicName: c.topicName,
          questionText: c.questionText,
          answerText: c.answerText
        }))
      }))
    });
  } catch (error: any) {
    console.error('Error browsing textbook content:', error);
    res.status(500).json({ error: 'Failed to browse content.' });
  }
};

/**
 * Uploads & indexes a new textbook or chapter by Teacher / Admin
 * Enforces versioning and duplicate prevention
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
      standard = 'Class 10',
      subject = 'Science',
      medium = 'English',
      academicYear = '2025-2026',
      version = '1.0',
      chapterNumber,
      chapterName,
      topic,
      sectionName,
      textContent
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Textbook title is required.' });
    }

    const chNum = chapterNumber ? parseInt(String(chapterNumber), 10) : null;

    // Duplicate Prevention Check
    const existingDoc = await prisma.textbookDocument.findFirst({
      where: {
        board: String(board),
        standard: String(standard),
        subject: String(subject),
        chapterNumber: chNum,
        title: title.trim(),
        version: String(version).trim()
      }
    });

    if (existingDoc) {
      return res.status(409).json({
        error: `A document with title "${title.trim()}" and version "${version}" already exists for ${board} ${standard} ${subject} Chapter ${chNum || ''}. Please update the version number to prevent duplicates.`
      });
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
        version: String(version || '1.0').trim(),
        chapterNumber: chNum,
        chapterName: chapterName ? chapterName.trim() : null,
        topic: topic ? topic.trim() : null,
        pdfFilePath: uploadedFile?.filename || null,
        fileSizeBytes: uploadedFile?.size || null,
        uploaderId: req.user?.id || null
      }
    });

    if (uploadedFile) {
      await persistFile(uploadedFile.path, uploadedFile.filename, uploadedFile.mimetype, uploadedFile.originalname);
    }

    // If raw text was provided, chunk and index it
    if (rawText && rawText.trim().length > 0) {
      const chunks = chunkTextContent(rawText, 550, 80);
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
            topicName: topic ? topic.trim() : document.chapterName,
            sectionName: sectionName ? sectionName.trim() : `Section ${i + 1}`,
            vectorJson: JSON.stringify(vector),
            keywords: `${board} ${standard} ${subject} ${document.chapterName} ${topic || ''}`
              .toLowerCase()
              .replace(/[^\w\s\u0A80-\u0AFF]/g, ' ')
          }
        });
      }
    } else if (uploadedFile) {
      // Default initial chunk for uploaded PDF document
      const fallbackContent = `${title}. Chapter ${chNum || 1}: ${chapterName || title}. Authorized curriculum notes for ${standard} ${subject} (${board} ${medium} Medium, Version ${version}).`;
      const vector = generateSemanticVector(fallbackContent);

      await prisma.textbookChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: 1,
          content: fallbackContent,
          pageNumber: 1,
          chapterName: document.chapterName,
          topicName: topic ? topic.trim() : document.chapterName,
          sectionName: sectionName ? sectionName.trim() : 'Section 1.1',
          vectorJson: JSON.stringify(vector),
          keywords: `${board} ${standard} ${subject} ${chapterName} ${topic || ''}`.toLowerCase()
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
      message: 'NCERT textbook document successfully indexed into knowledge base.',
      document: {
        ...createdWithChunks,
        chunkCount: createdWithChunks?._count.chunks || 0
      }
    });
  } catch (error: any) {
    console.error('Error uploading textbook:', error);
    res.status(500).json({ error: 'Failed to upload and index textbook document.' });
  }
};

/**
 * Updates an existing textbook document metadata & version
 */
export const updateTextbook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers and administrators can update textbooks.' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Textbook ID is required.' });

    const { title, titleGu, version, chapterName, topic } = req.body;

    const existing = await prisma.textbookDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Textbook document not found.' });
    }

    const updated = await prisma.textbookDocument.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        titleGu: titleGu !== undefined ? (titleGu ? String(titleGu).trim() : null) : undefined,
        version: version !== undefined ? String(version).trim() : undefined,
        chapterName: chapterName !== undefined ? (chapterName ? String(chapterName).trim() : null) : undefined,
        topic: topic !== undefined ? (topic ? String(topic).trim() : null) : undefined
      }
    });

    res.json({
      success: true,
      message: 'Textbook metadata updated successfully.',
      document: updated
    });
  } catch (error: any) {
    console.error('Error updating textbook:', error);
    res.status(500).json({ error: 'Failed to update textbook.' });
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
 * Returns RAG knowledge base statistics & audit totals
 */
export const getRAGStats = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSeedTextbooksExist();

    const [totalBooks, totalChunks, ncertCount, gsebCount, totalAudits, verifiedAudits] = await Promise.all([
      prisma.textbookDocument.count(),
      prisma.textbookChunk.count(),
      prisma.textbookDocument.count({ where: { board: 'NCERT' } }),
      prisma.textbookDocument.count({ where: { board: 'GSEB' } }),
      prisma.ncertQueryAudit.count(),
      prisma.ncertQueryAudit.count({ where: { isGrounded: true } })
    ]);

    const standards = await prisma.textbookDocument.findMany({
      select: { standard: true },
      distinct: ['standard']
    });

    const subjects = await prisma.textbookDocument.findMany({
      select: { subject: true },
      distinct: ['subject']
    });

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalChunks,
        ncertCount,
        gsebCount,
        totalAudits,
        verifiedAudits,
        standards: standards.map(s => s.standard).filter(Boolean),
        subjects: subjects.map(s => s.subject).filter(Boolean)
      }
    });
  } catch (error: any) {
    console.error('Error getting RAG stats:', error);
    res.status(500).json({ error: 'Failed to get knowledge base statistics.' });
  }
};

/**
 * Returns audit trail logs for verified NCERT queries
 */
export const getNcertAudits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = '25' } = req.query;
    const maxLimit = Math.min(parseInt(String(limit), 10) || 25, 100);

    const audits = await prisma.ncertQueryAudit.findMany({
      take: maxLimit,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: audits.length,
      audits: audits.map(a => ({
        id: a.id,
        userId: a.userId,
        question: a.question,
        answer: a.answer,
        isGrounded: a.isGrounded,
        groundingStatus: a.groundingStatus,
        relevanceScore: a.relevanceScore,
        board: a.board,
        standard: a.standard,
        subject: a.subject,
        citations: a.citationsJson ? JSON.parse(a.citationsJson) : [],
        sourceChunkIds: a.sourceChunkIds ? a.sourceChunkIds.split(',') : [],
        createdAt: a.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Error getting NCERT audits:', error);
    res.status(500).json({ error: 'Failed to get audit log.' });
  }
};
