import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import {
  getSafeVideoLectureFilePath,
  removeVideoLectureFile,
  VIDEO_LECTURES_UPLOAD_DIR
} from '../services/fileStorage';

const JWT_SECRET = process.env.JWT_SECRET || 'study_assistant_super_secret_jwt_key_2026_antigravity';

/**
 * Teacher/Admin: Upload and create a new MP4 Video Lecture
 */
export const createVideoLecture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: Teacher login required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an MP4 video file' });
    }

    const {
      title,
      titleGu,
      description,
      descriptionGu,
      standard,
      subjectId,
      chapterId,
      topicId,
      status
    } = req.body;

    if (!title || !title.trim()) {
      removeVideoLectureFile(req.file.filename);
      return res.status(400).json({ error: 'Video lecture title is required' });
    }

    if (!subjectId) {
      removeVideoLectureFile(req.file.filename);
      return res.status(400).json({ error: 'Please select a valid subject' });
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      removeVideoLectureFile(req.file.filename);
      return res.status(404).json({ error: 'Selected subject does not exist' });
    }

    const targetStandard = standard || subject.standard || 'Standard 8';

    const lecture = await prisma.videoLecture.create({
      data: {
        title: title.trim(),
        titleGu: titleGu?.trim() || title.trim(),
        description: description?.trim() || null,
        descriptionGu: descriptionGu?.trim() || description?.trim() || null,
        standard: targetStandard,
        subjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        teacherId,
        videoFilePath: req.file.filename,
        videoFileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        mimeType: 'video/mp4',
        status: status || 'PUBLISHED',
        viewsCount: 0
      },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        teacher: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      message: 'Video lecture uploaded successfully',
      lecture
    });
  } catch (error: any) {
    console.error('Create video lecture error:', error);
    if (req.file) {
      removeVideoLectureFile(req.file.filename);
    }
    res.status(500).json({ error: 'Failed to upload video lecture' });
  }
};

/**
 * Teacher/Admin: Get all video lectures with filters and metrics
 */
export const getTeacherVideoLectures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { standard, subjectId, search } = req.query;

    const whereClause: any = {};

    if (standard && standard !== 'ALL') {
      whereClause.standard = String(standard);
    }

    if (subjectId && subjectId !== 'ALL') {
      whereClause.subjectId = String(subjectId);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      whereClause.OR = [
        { title: { contains: q } },
        { titleGu: { contains: q } },
        { description: { contains: q } }
      ];
    }

    const [lectures, totalCount, viewsAgg, std6Count, std7Count, std8Count] = await Promise.all([
      prisma.videoLecture.findMany({
        where: whereClause,
        include: {
          subject: true,
          chapter: true,
          topic: true,
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { accesses: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.videoLecture.count({ where: whereClause }),
      prisma.videoLecture.aggregate({
        where: whereClause,
        _sum: { viewsCount: true }
      }),
      prisma.videoLecture.count({ where: { standard: 'Standard 6' } }),
      prisma.videoLecture.count({ where: { standard: 'Standard 7' } }),
      prisma.videoLecture.count({ where: { standard: 'Standard 8' } })
    ]);

    res.json({
      lectures,
      summary: {
        totalLectures: totalCount,
        totalViews: viewsAgg._sum.viewsCount || 0,
        standard6Lectures: std6Count,
        standard7Lectures: std7Count,
        standard8Lectures: std8Count
      }
    });
  } catch (error) {
    console.error('Get teacher video lectures error:', error);
    res.status(500).json({ error: 'Failed to fetch video lectures' });
  }
};

/**
 * Teacher/Admin: Delete a video lecture
 */
export const deleteVideoLecture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lecture = await prisma.videoLecture.findUnique({ where: { id } });
    if (!lecture) {
      return res.status(404).json({ error: 'Video lecture not found' });
    }

    // Remove file from disk
    removeVideoLectureFile(lecture.videoFilePath);

    // Delete database record (cascades accesses)
    await prisma.videoLecture.delete({ where: { id } });

    res.json({ message: 'Video lecture deleted successfully' });
  } catch (error) {
    console.error('Delete video lecture error:', error);
    res.status(500).json({ error: 'Failed to delete video lecture' });
  }
};

/**
 * Student: Get video lectures filtered by student's standard
 */
export const getStudentVideoLectures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    const userStandard = studentProfile?.standard || 'Standard 8';

    const userRole = req.user?.role;
    const { standard, subjectId, search } = req.query;

    // For students: Strictly lock to their existing standard only (no other standards)
    const targetStandard = userRole === 'STUDENT'
      ? userStandard
      : (standard && standard !== 'ALL' ? String(standard) : undefined);

    const whereClause: any = {
      status: 'PUBLISHED'
    };

    if (targetStandard) {
      whereClause.OR = [
        { standard: targetStandard },
        { standard: 'ALL' }
      ];
    }

    if (subjectId && subjectId !== 'ALL') {
      whereClause.subjectId = String(subjectId);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      whereClause.AND = [
        {
          OR: [
            { title: { contains: q } },
            { titleGu: { contains: q } },
            { description: { contains: q } },
            { descriptionGu: { contains: q } }
          ]
        }
      ];
    }

    const [lectures, distinctStandards] = await Promise.all([
      prisma.videoLecture.findMany({
        where: whereClause,
        include: {
          subject: true,
          chapter: true,
          topic: true,
          teacher: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subject.findMany({
        select: { standard: true },
        distinct: ['standard']
      })
    ]);

    const existingStandards = distinctStandards.map(s => s.standard).filter(Boolean);

    const lecturesWithAccess = lectures.map(l => ({
      ...l,
      isAccessible: true
    }));

    res.json({
      lectures: lecturesWithAccess,
      userStandard,
      activeStandard: targetStandard || userStandard,
      existingStandards
    });
  } catch (error) {
    console.error('Get student video lectures error:', error);
    res.status(500).json({ error: 'Failed to fetch video lectures' });
  }
};

/**
 * Get Video Lecture by ID
 */
export const getVideoLectureById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lecture = await prisma.videoLecture.findUnique({
      where: { id },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        teacher: { select: { id: true, name: true } }
      }
    });

    if (!lecture) {
      return res.status(404).json({ error: 'Video lecture not found' });
    }

    res.json({ lecture });
  } catch (error) {
    console.error('Get video lecture error:', error);
    res.status(500).json({ error: 'Failed to fetch video lecture' });
  }
};

/**
 * Stream Video Lecture (HTTP 206 Partial Content / Range Requests for smooth scrubbing)
 */
export const streamVideoLecture = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lecture = await prisma.videoLecture.findUnique({ where: { id } });
    if (!lecture) {
      return res.status(404).json({ error: 'Video lecture not found' });
    }

    // Access control: Enforce enrolled standard for students
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.role === 'STUDENT') {
          const profile = await prisma.studentProfile.findUnique({ where: { userId: decoded.id } });
          const userStandard = profile?.standard;
          if (userStandard && lecture.standard !== 'ALL' && lecture.standard !== userStandard) {
            return res.status(403).json({
              error: `Access denied. This video lecture is for ${lecture.standard}. Your enrolled grade is ${userStandard}.`
            });
          }
        }
      } catch (tokenErr) {
        console.warn('Stream token verification warning:', tokenErr);
      }
    }

    const filePath = getSafeVideoLectureFilePath(lecture.videoFilePath);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'MP4 video file not found on server' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Common streaming headers
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');

    if (range) {
      // Support RFC 7233 range formats:
      // "bytes=0-1000", "bytes=1000-", "bytes=-500"
      const match = range.match(/bytes=(\d*)-(\d*)/);
      let start = 0;
      let end = fileSize - 1;

      if (match) {
        if (match[1] === '' && match[2] !== '') {
          // Suffix byte range e.g. "bytes=-500" (last 500 bytes)
          const suffixLength = parseInt(match[2], 10);
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else {
          start = match[1] ? parseInt(match[1], 10) : 0;
          end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        }
      }

      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= fileSize) end = fileSize - 1;

      if (start >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });

      const fileStream = fs.createReadStream(filePath, { start, end });
      req.on('close', () => {
        fileStream.destroy();
      });
      fileStream.on('error', (streamErr) => {
        console.error('Video file stream error:', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
      const fileStream = fs.createReadStream(filePath);
      req.on('close', () => {
        fileStream.destroy();
      });
      fileStream.on('error', (streamErr) => {
        console.error('Video file stream error:', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Stream video lecture error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream video lecture' });
    }
  }
};

/**
 * Track Video View & Watch Time
 */
export const trackVideoView = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { watchDurationSeconds } = req.body;

    const lecture = await prisma.videoLecture.findUnique({ where: { id } });
    if (!lecture) {
      return res.status(404).json({ error: 'Video lecture not found' });
    }

    // Increment view count
    await prisma.videoLecture.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    });

    // Record student access if student
    if (userId && req.user?.role === 'STUDENT') {
      await prisma.videoLectureAccess.create({
        data: {
          lectureId: id,
          studentId: userId,
          watchDurationSeconds: Number(watchDurationSeconds) || 0,
          lastWatchedAt: new Date()
        }
      });
    }

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Track video view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
};
