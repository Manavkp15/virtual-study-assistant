import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { removeMaterialFile, getSafeMaterialFilePath, STUDY_MATERIALS_UPLOAD_DIR, persistFile, ensureFileOnDisk, deletePersistedFile } from '../services/fileStorage';
import { detectWeakTopics } from '../algorithms/weakTopicDetector';
import { getTeacherAssignedSubjects } from '../utils/subjectConstants';
import fs from 'fs';

/**
 * Parses and validates educational video URLs (YouTube, Vimeo, etc.)
 */
export const parseVideoUrl = (rawUrl?: string | null): {
  isValid: boolean;
  isEmbeddable: boolean;
  embedUrl: string | null;
  originalUrl: string | null;
} => {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { isValid: false, isEmbeddable: false, embedUrl: null, originalUrl: null };
  }

  const trimmed = rawUrl.trim();

  // Basic URL sanity validation
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, isEmbeddable: false, embedUrl: null, originalUrl: null };
    }
  } catch {
    return { isValid: false, isEmbeddable: false, embedUrl: null, originalUrl: null };
  }

  // 1. YouTube standard and short URLs
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  if (ytMatch && ytMatch[1]) {
    return {
      isValid: true,
      isEmbeddable: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      originalUrl: trimmed
    };
  }

  // 2. Vimeo URLs
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isValid: true,
      isEmbeddable: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: trimmed
    };
  }

  // Generic valid educational video URL (fallback to safe external watch)
  return {
    isValid: true,
    isEmbeddable: false,
    embedUrl: null,
    originalUrl: trimmed
  };
};

// ============================================================================
// STUDENT CONTROLLERS
// ============================================================================

/**
 * Get published study materials for the student's standard with search & filters
 */
export const getStudentMaterials = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });
    const standard = profile?.standard || 'Standard 8';

    const { subjectId, chapterId, topicId, search } = req.query;

    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { standard: standard },
        { standard: 'ALL' }
      ]
    };

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }
    if (chapterId && typeof chapterId === 'string' && chapterId !== 'ALL') {
      where.chapterId = chapterId;
    }
    if (topicId && typeof topicId === 'string' && topicId !== 'ALL') {
      where.topicId = topicId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q } },
            { titleGu: { contains: q } },
            { description: { contains: q } },
            { descriptionGu: { contains: q } },
            { videoTitle: { contains: q } },
            { teacher: { name: { contains: q } } },
            { subject: { name: { contains: q } } }
          ]
        }
      ];
    }

    const [materials, studentAccesses] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, nameGu: true, code: true, icon: true } },
          chapter: { select: { id: true, name: true, nameGu: true } },
          topic: { select: { id: true, name: true, nameGu: true } },
          teacher: { select: { id: true, name: true, email: true } }
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.studyMaterialAccess.findMany({
        where: { studentId }
      })
    ]);

    // Map student's interaction flags per material
    const accessedMap = new Map<string, { isStudied: boolean; hasViewed: boolean; hasDownloaded: boolean; hasWatchedVideo: boolean }>();
    studentAccesses.forEach(acc => {
      const existing = accessedMap.get(acc.materialId) || {
        isStudied: false,
        hasViewed: false,
        hasDownloaded: false,
        hasWatchedVideo: false
      };
      if (acc.eventType === 'STUDIED') existing.isStudied = true;
      if (acc.eventType === 'VIEW' || acc.eventType === 'PDF_VIEW') existing.hasViewed = true;
      if (acc.eventType === 'PDF_DOWNLOAD') existing.hasDownloaded = true;
      if (acc.eventType === 'VIDEO_CLICK') existing.hasWatchedVideo = true;
      accessedMap.set(acc.materialId, existing);
    });

    const enrichedMaterials = materials.map(m => {
      const videoMeta = parseVideoUrl(m.videoUrl);
      const studentState = accessedMap.get(m.id) || {
        isStudied: false,
        hasViewed: false,
        hasDownloaded: false,
        hasWatchedVideo: false
      };

      return {
        ...m,
        videoMeta,
        studentState
      };
    });

    res.json({ materials: enrichedMaterials, standard });
  } catch (error: any) {
    console.error('getStudentMaterials error:', error);
    res.status(500).json({ error: 'Failed to fetch study materials' });
  }
};

/**
 * Get AI study recommendations linking weak topics with published study materials
 */
export const getRecommendedMaterials = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });
    const standard = profile?.standard || 'Standard 8';

    // Detect student weak topics using the existing algorithm
    const weakData = await detectWeakTopics(studentId);
    const weakTopicIds = weakData.weakTopics.map(w => w.topicId);

    if (weakTopicIds.length === 0) {
      // Fallback: return top published materials for standard
      const popular = await prisma.studyMaterial.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [{ standard }, { standard: 'ALL' }]
        },
        include: {
          subject: { select: { id: true, name: true, nameGu: true, icon: true } },
          chapter: { select: { id: true, name: true, nameGu: true } },
          topic: { select: { id: true, name: true, nameGu: true } },
          teacher: { select: { id: true, name: true } }
        },
        orderBy: [{ viewsCount: 'desc' }, { publishedAt: 'desc' }],
        take: 3
      });

      return res.json({
        recommendations: popular.map(m => ({
          material: m,
          reason: 'Popular high-yield study material for your standard',
          reasonGu: 'તમારા ધોરણ માટે લોકપ્રિય અને ઉપયોગી અભ્યાસ સાહિત્ય',
          isWeakTopicMatch: false
        }))
      });
    }

    // Find materials directly matching weak topic IDs
    const matchedMaterials = await prisma.studyMaterial.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ standard }, { standard: 'ALL' }],
        topicId: { in: weakTopicIds }
      },
      include: {
        subject: { select: { id: true, name: true, nameGu: true, icon: true } },
        chapter: { select: { id: true, name: true, nameGu: true } },
        topic: { select: { id: true, name: true, nameGu: true } },
        teacher: { select: { id: true, name: true } }
      },
      take: 4
    });

    const recommendations = matchedMaterials.map(m => {
      const topicInfo = weakData.weakTopics.find(w => w.topicId === m.topicId);
      const acc = topicInfo ? topicInfo.accuracy : 50;
      return {
        material: m,
        reason: `Targeted review recommended: your accuracy in ${topicInfo?.topicName || m.topic?.name || 'this topic'} is ${acc}%`,
        reasonGu: `લક્ષિત પુનરાવર્તનની ભલામણ: ${topicInfo?.topicNameGu || m.topic?.nameGu || 'આ વિષય'}માં તમારી ચોકસાઈ ${acc}% છે`,
        isWeakTopicMatch: true,
        accuracy: acc
      };
    });

    res.json({ recommendations });
  } catch (error: any) {
    console.error('getRecommendedMaterials error:', error);
    res.status(500).json({ error: 'Failed to fetch recommended study materials' });
  }
};

/**
 * Get student study material metrics summary
 */
export const getStudentMaterialSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });
    const standard = profile?.standard || 'Standard 8';

    const [totalAvailable, pdfCount, videoCount, accesses] = await Promise.all([
      prisma.studyMaterial.count({
        where: { status: 'PUBLISHED', OR: [{ standard }, { standard: 'ALL' }] }
      }),
      prisma.studyMaterial.count({
        where: {
          status: 'PUBLISHED',
          OR: [{ standard }, { standard: 'ALL' }],
          pdfFilePath: { not: null }
        }
      }),
      prisma.studyMaterial.count({
        where: {
          status: 'PUBLISHED',
          OR: [{ standard }, { standard: 'ALL' }],
          videoUrl: { not: null }
        }
      }),
      prisma.studyMaterialAccess.findMany({
        where: { studentId }
      })
    ]);

    const studiedMaterialIds = new Set<string>();
    const viewedMaterialIds = new Set<string>();
    let pdfViews = 0;
    let downloads = 0;
    let videoClicks = 0;

    accesses.forEach(a => {
      if (a.eventType === 'STUDIED') studiedMaterialIds.add(a.materialId);
      if (a.eventType === 'VIEW' || a.eventType === 'PDF_VIEW') {
        viewedMaterialIds.add(a.materialId);
        if (a.eventType === 'PDF_VIEW') pdfViews += 1;
      }
      if (a.eventType === 'PDF_DOWNLOAD') downloads += 1;
      if (a.eventType === 'VIDEO_CLICK') videoClicks += 1;
    });

    res.json({
      summary: {
        totalAvailable,
        pdfCount,
        videoCount,
        studiedCount: studiedMaterialIds.size,
        viewedCount: viewedMaterialIds.size,
        pdfViews,
        downloads,
        videoClicks
      }
    });
  } catch (error: any) {
    console.error('getStudentMaterialSummary error:', error);
    res.status(500).json({ error: 'Failed to fetch study material summary' });
  }
};

/**
 * Get individual study material by ID
 */
export const getMaterialById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, nameGu: true, code: true, icon: true } },
        chapter: { select: { id: true, name: true, nameGu: true } },
        topic: { select: { id: true, name: true, nameGu: true } },
        teacher: { select: { id: true, name: true, email: true } }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Access control:
    // Students can only access PUBLISHED materials
    if (userRole === 'STUDENT') {
      if (material.status !== 'PUBLISHED') {
        return res.status(403).json({ error: 'This study material is not published' });
      }

      // Track student view event asynchronously
      if (userId) {
        prisma.studyMaterialAccess.create({
          data: {
            materialId: id,
            studentId: userId,
            eventType: 'VIEW'
          }
        }).catch(err => console.error('Failed to log material view:', err));

        prisma.studyMaterial.update({
          where: { id },
          data: { viewsCount: { increment: 1 } }
        }).catch(err => console.error('Failed to increment view counter:', err));
      }
    }

    const videoMeta = parseVideoUrl(material.videoUrl);

    res.json({ material: { ...material, videoMeta } });
  } catch (error: any) {
    console.error('getMaterialById error:', error);
    res.status(500).json({ error: 'Failed to fetch material details' });
  }
};

/**
 * Stream study material PDF inline (RBAC authenticated)
 */
export const streamMaterialPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const material = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (!material || !material.pdfFilePath) {
      return res.status(404).json({ error: 'PDF material not found' });
    }

    // RBAC validation
    if (userRole === 'STUDENT' && material.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Unauthorized to view unpublished material' });
    }

    const safePath = (await ensureFileOnDisk(material.pdfFilePath, STUDY_MATERIALS_UPLOAD_DIR)) || getSafeMaterialFilePath(material.pdfFilePath);
    if (!safePath || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    // Log PDF view event for student
    if (userRole === 'STUDENT' && userId) {
      prisma.studyMaterialAccess.create({
        data: {
          materialId: id,
          studentId: userId,
          eventType: 'PDF_VIEW'
        }
      }).catch(err => console.error('Failed to log PDF view:', err));

      prisma.studyMaterial.update({
        where: { id },
        data: { viewsCount: { increment: 1 } }
      }).catch(err => console.error('Failed to increment viewsCount:', err));
    }

    const sanitizedDownloadName = (material.pdfFileName || 'study_material.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedDownloadName}"`);

    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('streamMaterialPdf error:', error);
    res.status(500).json({ error: 'Failed to retrieve PDF file' });
  }
};

/**
 * Download study material PDF (RBAC authenticated)
 */
export const downloadMaterialPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const material = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (!material || !material.pdfFilePath) {
      return res.status(404).json({ error: 'PDF material not found' });
    }

    if (userRole === 'STUDENT' && material.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Unauthorized to download unpublished material' });
    }

    const safePath = (await ensureFileOnDisk(material.pdfFilePath, STUDY_MATERIALS_UPLOAD_DIR)) || getSafeMaterialFilePath(material.pdfFilePath);
    if (!safePath || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    // Log download event
    if (userRole === 'STUDENT' && userId) {
      prisma.studyMaterialAccess.create({
        data: {
          materialId: id,
          studentId: userId,
          eventType: 'PDF_DOWNLOAD'
        }
      }).catch(err => console.error('Failed to log PDF download:', err));

      prisma.studyMaterial.update({
        where: { id },
        data: { downloadsCount: { increment: 1 } }
      }).catch(err => console.error('Failed to increment downloadsCount:', err));
    }

    const sanitizedDownloadName = (material.pdfFileName || 'study_material.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedDownloadName}"`);

    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('downloadMaterialPdf error:', error);
    res.status(500).json({ error: 'Failed to download PDF file' });
  }
};

/**
 * Track student interaction events: VIEW, VIDEO_CLICK, STUDIED
 */
export const trackMaterialEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;
    const { eventType } = req.body; // VIEW, VIDEO_CLICK, STUDIED

    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const material = await prisma.studyMaterial.findUnique({
      where: { id }
    });
    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    if (eventType === 'STUDIED') {
      // Toggle studied: if already studied, remove; otherwise create
      const existing = await prisma.studyMaterialAccess.findFirst({
        where: { materialId: id, studentId, eventType: 'STUDIED' }
      });

      if (existing) {
        await prisma.studyMaterialAccess.delete({ where: { id: existing.id } });
        return res.json({ message: 'Marked as unstudied', isStudied: false });
      } else {
        await prisma.studyMaterialAccess.create({
          data: { materialId: id, studentId, eventType: 'STUDIED' }
        });
        return res.json({ message: 'Marked as studied', isStudied: true });
      }
    }

    if (eventType === 'VIDEO_CLICK') {
      await Promise.all([
        prisma.studyMaterialAccess.create({
          data: { materialId: id, studentId, eventType: 'VIDEO_CLICK' }
        }),
        prisma.studyMaterial.update({
          where: { id },
          data: { videoClicksCount: { increment: 1 } }
        })
      ]);
      return res.json({ message: 'Video click recorded' });
    }

    if (eventType === 'VIEW') {
      await Promise.all([
        prisma.studyMaterialAccess.create({
          data: { materialId: id, studentId, eventType: 'VIEW' }
        }),
        prisma.studyMaterial.update({
          where: { id },
          data: { viewsCount: { increment: 1 } }
        })
      ]);
      return res.json({ message: 'View recorded' });
    }

    res.status(400).json({ error: 'Invalid eventType' });
  } catch (error: any) {
    console.error('trackMaterialEvent error:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
};

// ============================================================================
// TEACHER / ADMIN CONTROLLERS
// ============================================================================

/**
 * Teacher overview metrics and analytics
 */
export const getTeacherMaterialOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const userRole = req.user?.role;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const isTeacher = userRole === 'TEACHER';
    let assignedSubjectsList: any[] = [];
    const where: any = {};

    if (isTeacher) {
      const assigned = await getTeacherAssignedSubjects(prisma, teacherId);
      const subjectIds = assigned.map(s => s.id);
      where.teacherId = teacherId;
      where.subjectId = { in: subjectIds };
      assignedSubjectsList = assigned;
    } else {
      assignedSubjectsList = await prisma.subject.findMany({ select: { id: true, name: true, nameGu: true } });
    }

    const [
      materials,
      totalStudents,
      subjects
    ] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, nameGu: true } },
          chapter: { select: { id: true, name: true, nameGu: true } },
          topic: { select: { id: true, name: true, nameGu: true } }
        }
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      Promise.resolve(assignedSubjectsList)
    ]);

    let publishedCount = 0;
    let draftCount = 0;
    let unpublishedCount = 0;
    let totalViews = 0;
    let totalDownloads = 0;
    let totalVideoClicks = 0;

    const subjectStatsMap = new Map<string, { name: string; nameGu: string; count: number; views: number }>();
    subjects.forEach(s => {
      subjectStatsMap.set(s.id, { name: s.name, nameGu: s.nameGu || s.name, count: 0, views: 0 });
    });

    materials.forEach(m => {
      if (m.status === 'PUBLISHED') publishedCount += 1;
      else if (m.status === 'DRAFT') draftCount += 1;
      else if (m.status === 'UNPUBLISHED') unpublishedCount += 1;

      totalViews += m.viewsCount;
      totalDownloads += m.downloadsCount;
      totalVideoClicks += m.videoClicksCount;

      const subEntry = subjectStatsMap.get(m.subjectId);
      if (subEntry) {
        subEntry.count += 1;
        subEntry.views += m.viewsCount;
      }
    });

    // Top accessed materials
    const topAccessed = [...materials]
      .sort((a, b) => (b.viewsCount + b.downloadsCount * 2 + b.videoClicksCount) - (a.viewsCount + a.downloadsCount * 2 + a.videoClicksCount))
      .slice(0, 5)
      .map(m => ({
        id: m.id,
        title: m.title,
        titleGu: m.titleGu,
        subjectName: m.subject?.name,
        subjectNameGu: m.subject?.nameGu,
        viewsCount: m.viewsCount,
        downloadsCount: m.downloadsCount,
        videoClicksCount: m.videoClicksCount,
        status: m.status
      }));

    const subjectBreakdown = Array.from(subjectStatsMap.values()).filter(s => s.count > 0);

    res.json({
      metrics: {
        totalMaterials: materials.length,
        publishedCount,
        draftCount,
        unpublishedCount,
        totalViews,
        totalDownloads,
        totalVideoClicks,
        totalStudents
      },
      topAccessed,
      subjectBreakdown
    });
  } catch (error: any) {
    console.error('getTeacherMaterialOverview error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher study material overview' });
  }
};

/**
 * Get all materials uploaded by teacher with filters & search
 */
export const getTeacherMaterials = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const userRole = req.user?.role;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const { standard, subjectId, status, search } = req.query;

    const isTeacher = userRole === 'TEACHER';
    const where: any = {};

    if (isTeacher) {
      where.teacherId = teacherId;
      const assigned = await getTeacherAssignedSubjects(prisma, teacherId);
      const assignedSubjectIds = assigned.map(s => s.id);

      if (subjectId && typeof subjectId === 'string' && subjectId !== 'ALL') {
        if (!assignedSubjectIds.includes(subjectId)) {
          return res.status(403).json({
            error: 'You are not authorized to view study materials for this subject.',
            messageGu: 'તમને આ વિષયની અભ્યાસ સામગ્રી જોવાની મંજૂરી નથી.'
          });
        }
        where.subjectId = subjectId;
      } else {
        where.subjectId = { in: assignedSubjectIds };
      }
    } else {
      if (subjectId && typeof subjectId === 'string' && subjectId !== 'ALL') {
        where.subjectId = subjectId;
      }
    }
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q } },
            { titleGu: { contains: q } },
            { description: { contains: q } },
            { videoTitle: { contains: q } }
          ]
        }
      ];
    }

    const materials = await prisma.studyMaterial.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, nameGu: true, code: true } },
        chapter: { select: { id: true, name: true, nameGu: true } },
        topic: { select: { id: true, name: true, nameGu: true } },
        teacher: { select: { id: true, name: true, email: true } },
        _count: {
          select: { accesses: true }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    const enriched = materials.map(m => ({
      ...m,
      videoMeta: parseVideoUrl(m.videoUrl)
    }));

    res.json({ materials: enriched });
  } catch (error: any) {
    console.error('getTeacherMaterials error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher materials' });
  }
};

/**
 * Create new study material (Draft or Published)
 */
export const createStudyMaterial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      titleGu,
      description,
      descriptionGu,
      subjectId,
      chapterId,
      topicId,
      standard,
      videoTitle,
      videoUrl,
      status
    } = req.body;

    // REQUIREMENT: Enforce backend verification so teachers can only upload study materials for their assigned subjects
    let targetSubjectId = subjectId;
    if (req.user?.role === 'TEACHER') {
      const assignedSubjects = await getTeacherAssignedSubjects(prisma, teacherId);
      if (assignedSubjects.length === 0) {
        if (req.file) removeMaterialFile(req.file.filename);
        return res.status(403).json({
          error: 'You do not have any assigned subjects to upload study materials.',
          messageGu: 'અભ્યાસ સામગ્રી અપલોડ કરવા માટે તમારી પાસે કોઈ વિષય ફાળવેલ નથી.'
        });
      }

      const assignedSubjectIds = assignedSubjects.map(s => s.id);

      if (targetSubjectId) {
        if (!assignedSubjectIds.includes(targetSubjectId)) {
          if (req.file) removeMaterialFile(req.file.filename);
          return res.status(403).json({
            error: 'You are not authorized to upload study materials for this subject.',
            messageGu: 'તમને આ વિષય માટે અભ્યાસ સામગ્રી અપલોડ કરવાની મંજૂરી નથી.'
          });
        }
      } else {
        if (assignedSubjects.length === 1) {
          targetSubjectId = assignedSubjects[0].id;
        } else {
          if (req.file) removeMaterialFile(req.file.filename);
          return res.status(400).json({
            error: 'Please select a subject from your assigned subjects.',
            messageGu: 'કૃપા કરીને તમારા સોંપાયેલા વિષયોમાંથી એક વિષય પસંદ કરો.'
          });
        }
      }
    }

    if (!title || !targetSubjectId) {
      if (req.file) removeMaterialFile(req.file.filename);
      return res.status(400).json({ error: 'Title and Subject are required' });
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: targetSubjectId }
    });
    if (!subject) {
      if (req.file) removeMaterialFile(req.file.filename);
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Validate video URL if provided
    let safeVideoUrl: string | null = null;
    let safeVideoTitle: string | null = null;
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
      const parsed = parseVideoUrl(videoUrl);
      if (!parsed.isValid) {
        if (req.file) removeMaterialFile(req.file.filename);
        return res.status(400).json({ error: 'Please enter a valid HTTP/HTTPS video URL' });
      }
      safeVideoUrl = parsed.originalUrl;
      safeVideoTitle = videoTitle?.trim() || null;
    }

    const materialStatus = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(status) ? status : 'PUBLISHED';
    const isPublished = materialStatus === 'PUBLISHED';

    const newMaterial = await prisma.studyMaterial.create({
      data: {
        title: title.trim(),
        titleGu: titleGu?.trim() || null,
        description: description?.trim() || null,
        descriptionGu: descriptionGu?.trim() || null,
        subjectId: targetSubjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        standard: standard || 'Standard 8',
        teacherId,
        pdfFilePath: req.file ? req.file.filename : null,
        pdfFileName: req.file ? req.file.originalname : null,
        fileSizeBytes: req.file ? req.file.size : null,
        mimeType: req.file ? req.file.mimetype : 'application/pdf',
        videoTitle: safeVideoTitle,
        videoUrl: safeVideoUrl,
        status: materialStatus,
        publishedAt: isPublished ? new Date() : null
      },
      include: {
        subject: { select: { id: true, name: true, nameGu: true } },
        chapter: { select: { id: true, name: true, nameGu: true } },
        topic: { select: { id: true, name: true, nameGu: true } }
      }
    });

    if (req.file) {
      await persistFile(req.file.path, req.file.filename, req.file.mimetype, req.file.originalname);
    }

    // Notify relevant students if published immediately
    if (isPublished) {
      const stdFilter = (newMaterial.standard && newMaterial.standard !== 'ALL')
        ? { standard: newMaterial.standard }
        : {};

      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          profile: stdFilter
        },
        select: { id: true }
      });

      const sName = subject.name;
      const sNameGu = subject.nameGu || sName;
      const matTitle = newMaterial.title;
      const matTitleGu = newMaterial.titleGu || matTitle;

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(st => ({
            userId: st.id,
            title: 'New Study Material Available',
            titleGu: 'નવું અભ્યાસ સાહિત્ય ઉપલબ્ધ',
            message: `Your teacher has uploaded new ${sName} study material: "${matTitle}"`,
            messageGu: `તમારા શિક્ષકે નવું ${sNameGu} અભ્યાસ સાહિત્ય અપલોડ કર્યું છે: "${matTitleGu}"`,
            type: 'STUDY_MATERIAL'
          }))
        });
      }
    }

    res.status(201).json({
      message: isPublished ? 'Study material published successfully' : 'Study material saved as draft',
      material: newMaterial
    });
  } catch (error: any) {
    if (req.file) removeMaterialFile(req.file.filename);
    console.error('createStudyMaterial error:', error);
    res.status(500).json({ error: error.message || 'Failed to create study material' });
  }
};

/**
 * Update existing study material (with optional PDF replacement)
 */
export const updateStudyMaterial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const userRole = req.user?.role;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: { subject: true }
    });

    if (!material) {
      if (req.file) removeMaterialFile(req.file.filename);
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Only owner teacher or admin can modify
    if (userRole !== 'ADMIN' && material.teacherId !== teacherId) {
      if (req.file) removeMaterialFile(req.file.filename);
      return res.status(403).json({ error: 'Unauthorized to modify this study material' });
    }

    if (userRole === 'TEACHER') {
      const assigned = await getTeacherAssignedSubjects(prisma, teacherId);
      const assignedSubjectIds = assigned.map(s => s.id);
      if (!assignedSubjectIds.includes(material.subjectId)) {
        if (req.file) removeMaterialFile(req.file.filename);
        return res.status(403).json({
          error: 'You are not authorized to update materials for this subject.',
          messageGu: 'તમને આ વિષય માટે સામગ્રી બદલવાની મંજૂરી નથી.'
        });
      }
      if (req.body.subjectId && !assignedSubjectIds.includes(req.body.subjectId)) {
        if (req.file) removeMaterialFile(req.file.filename);
        return res.status(403).json({
          error: 'You are not authorized to assign materials to this subject.',
          messageGu: 'તમને આ વિષય માટે સામગ્રી સોંપવાની મંજૂરી નથી.'
        });
      }
    }

    const {
      title,
      titleGu,
      description,
      descriptionGu,
      subjectId,
      chapterId,
      topicId,
      standard,
      videoTitle,
      videoUrl,
      status
    } = req.body;

    const dataToUpdate: any = {};
    if (title) dataToUpdate.title = title.trim();
    if (titleGu !== undefined) dataToUpdate.titleGu = titleGu ? titleGu.trim() : null;
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (descriptionGu !== undefined) dataToUpdate.descriptionGu = descriptionGu ? descriptionGu.trim() : null;
    if (subjectId) dataToUpdate.subjectId = subjectId;
    if (chapterId !== undefined) dataToUpdate.chapterId = chapterId || null;
    if (topicId !== undefined) dataToUpdate.topicId = topicId || null;
    if (standard) dataToUpdate.standard = standard;

    if (videoUrl !== undefined) {
      if (videoUrl && videoUrl.trim()) {
        const parsed = parseVideoUrl(videoUrl);
        if (!parsed.isValid) {
          if (req.file) removeMaterialFile(req.file.filename);
          return res.status(400).json({ error: 'Invalid video URL' });
        }
        dataToUpdate.videoUrl = parsed.originalUrl;
        dataToUpdate.videoTitle = videoTitle?.trim() || null;
      } else {
        dataToUpdate.videoUrl = null;
        dataToUpdate.videoTitle = null;
      }
    }

    // Handle PDF replacement if a new file was uploaded
    if (req.file) {
      if (material.pdfFilePath) {
        await deletePersistedFile(material.pdfFilePath, STUDY_MATERIALS_UPLOAD_DIR);
      }
      await persistFile(req.file.path, req.file.filename, req.file.mimetype, req.file.originalname);
      dataToUpdate.pdfFilePath = req.file.filename;
      dataToUpdate.pdfFileName = req.file.originalname;
      dataToUpdate.fileSizeBytes = req.file.size;
      dataToUpdate.mimeType = req.file.mimetype;
    }

    // Status transition tracking
    const wasPublished = material.status === 'PUBLISHED';
    let newlyPublished = false;

    if (status && ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(status)) {
      dataToUpdate.status = status;
      if (status === 'PUBLISHED' && !wasPublished) {
        dataToUpdate.publishedAt = new Date();
        newlyPublished = true;
      }
    }

    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: dataToUpdate,
      include: {
        subject: { select: { id: true, name: true, nameGu: true } },
        chapter: { select: { id: true, name: true, nameGu: true } },
        topic: { select: { id: true, name: true, nameGu: true } }
      }
    });

    // Notify students if newly published
    if (newlyPublished) {
      const stdFilter = (updated.standard && updated.standard !== 'ALL')
        ? { standard: updated.standard }
        : {};

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', profile: stdFilter },
        select: { id: true }
      });

      const sName = updated.subject.name;
      const sNameGu = updated.subject.nameGu || sName;

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(st => ({
            userId: st.id,
            title: 'New Study Material Available',
            titleGu: 'નવું અભ્યાસ સાહિત્ય ઉપલબ્ધ',
            message: `Your teacher has uploaded new ${sName} study material: "${updated.title}"`,
            messageGu: `તમારા શિક્ષકે નવું ${sNameGu} અભ્યાસ સાહિત્ય અપલોડ કર્યું છે: "${updated.titleGu || updated.title}"`,
            type: 'STUDY_MATERIAL'
          }))
        });
      }
    }

    res.json({
      message: 'Study material updated successfully',
      material: updated
    });
  } catch (error: any) {
    if (req.file) removeMaterialFile(req.file.filename);
    console.error('updateStudyMaterial error:', error);
    res.status(500).json({ error: error.message || 'Failed to update study material' });
  }
};

/**
 * Toggle Publish / Unpublish status
 */
export const updateMaterialStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // DRAFT, PUBLISHED, UNPUBLISHED
    const teacherId = req.user?.id;
    const userRole = req.user?.role;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    if (!['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be DRAFT, PUBLISHED, or UNPUBLISHED' });
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: { subject: true }
    });

    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    if (userRole !== 'ADMIN' && material.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const wasPublished = material.status === 'PUBLISHED';
    const newlyPublished = status === 'PUBLISHED' && !wasPublished;

    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: {
        status,
        ...(newlyPublished ? { publishedAt: new Date() } : {})
      }
    });

    // Notify students if transitioned to PUBLISHED
    if (newlyPublished) {
      const stdFilter = (material.standard && material.standard !== 'ALL')
        ? { standard: material.standard }
        : {};

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', profile: stdFilter },
        select: { id: true }
      });

      const sName = material.subject.name;
      const sNameGu = material.subject.nameGu || sName;

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(st => ({
            userId: st.id,
            title: 'New Study Material Published',
            titleGu: 'નવું અભ્યાસ સાહિત્ય પ્રકાશિત થયું',
            message: `Your teacher has published ${sName} study material: "${material.title}"`,
            messageGu: `તમારા શિક્ષકે ${sNameGu} અભ્યાસ સાહિત્ય પ્રકાશિત કર્યું છે: "${material.titleGu || material.title}"`,
            type: 'STUDY_MATERIAL'
          }))
        });
      }
    }

    res.json({
      message: `Status updated to ${status}`,
      material: updated
    });
  } catch (error: any) {
    console.error('updateMaterialStatus error:', error);
    res.status(500).json({ error: 'Failed to update material status' });
  }
};

/**
 * Delete study material and associated PDF file
 */
export const deleteStudyMaterial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const userRole = req.user?.role;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const material = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    if (userRole !== 'ADMIN' && material.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Unauthorized to delete this study material' });
    }

    // Safely remove PDF file from disk and database
    if (material.pdfFilePath) {
      await deletePersistedFile(material.pdfFilePath, STUDY_MATERIALS_UPLOAD_DIR);
    }

    await prisma.studyMaterial.delete({
      where: { id }
    });

    res.json({ message: 'Study material deleted successfully' });
  } catch (error: any) {
    console.error('deleteStudyMaterial error:', error);
    res.status(500).json({ error: 'Failed to delete study material' });
  }
};
