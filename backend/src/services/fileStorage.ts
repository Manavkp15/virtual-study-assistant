import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../database/prisma';

// Secure upload directory outside of public web root
export const HOMEWORK_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/homework');

if (!fs.existsSync(HOMEWORK_UPLOAD_DIR)) {
  fs.mkdirSync(HOMEWORK_UPLOAD_DIR, { recursive: true });
}

// Disk storage engine with unique, sanitized filenames
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(HOMEWORK_UPLOAD_DIR)) {
      fs.mkdirSync(HOMEWORK_UPLOAD_DIR, { recursive: true });
    }
    cb(null, HOMEWORK_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    // Sanitize original filename (keep only alphanumeric, dots, dashes, underscores)
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const sanitizedFilename = `hw-${timestamp}-${randomHex}-${baseName || 'document'}${ext || '.pdf'}`;
    cb(null, sanitizedFilename);
  }
});

// File filter allowing PDF, JPG, PNG, and WEBP for handwritten homework & documents
const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = allowedMimes.includes(file.mimetype);
  const isAllowedExt = allowedExts.includes(ext);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error('ONLY_PDF_AND_IMAGES_ALLOWED'));
  }
};

// Multer upload middleware instance (supports PDF and images up to 50MB)
export const homeworkUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Multi-file upload middleware for multi-page handwritten homework
export const homeworkMultiUpload = homeworkUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 15 },
  { name: 'pages', maxCount: 15 }
]);

/**
 * Helper to safely delete an uploaded file from disk
 */
export const removeUploadedFile = (filenameOrPath: string): void => {
  try {
    const filename = path.basename(filenameOrPath);
    const fullPath = path.join(HOMEWORK_UPLOAD_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`[FileStorage] Failed to remove file ${filenameOrPath}:`, err);
  }
};

/**
 * Helper to verify that a file exists and resides within the allowed directory
 */
export const getSafeFilePath = (filename: string): string | null => {
  const safeName = path.basename(filename);
  const fullPath = path.join(HOMEWORK_UPLOAD_DIR, safeName);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
};

// ============================================================================
// STUDY MATERIALS FILE STORAGE
// ============================================================================

export const STUDY_MATERIALS_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/materials');

if (!fs.existsSync(STUDY_MATERIALS_UPLOAD_DIR)) {
  fs.mkdirSync(STUDY_MATERIALS_UPLOAD_DIR, { recursive: true });
}

const materialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(STUDY_MATERIALS_UPLOAD_DIR)) {
      fs.mkdirSync(STUDY_MATERIALS_UPLOAD_DIR, { recursive: true });
    }
    cb(null, STUDY_MATERIALS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const sanitizedFilename = `mat-${timestamp}-${randomHex}-${baseName || 'material'}${ext || '.pdf'}`;
    cb(null, sanitizedFilename);
  }
});

// Multer upload middleware instance for Study Materials (strictly PDF, ZERO size limit)
export const studyMaterialUpload = multer({
  storage: materialStorage,
  fileFilter
});

/**
 * Helper to safely delete an uploaded study material file from disk
 */
export const removeMaterialFile = (filenameOrPath: string): void => {
  try {
    const filename = path.basename(filenameOrPath);
    const fullPath = path.join(STUDY_MATERIALS_UPLOAD_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`[FileStorage] Failed to remove study material file ${filenameOrPath}:`, err);
  }
};

/**
 * Helper to verify that a study material file exists and resides within allowed directory
 */
export const getSafeMaterialFilePath = (filename: string): string | null => {
  const safeName = path.basename(filename);
  const fullPath = path.join(STUDY_MATERIALS_UPLOAD_DIR, safeName);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
};

// ============================================================================
// VIDEO LECTURES FILE STORAGE (Strictly MP4, no links)
// ============================================================================

export const VIDEO_LECTURES_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/videos');

if (!fs.existsSync(VIDEO_LECTURES_UPLOAD_DIR)) {
  fs.mkdirSync(VIDEO_LECTURES_UPLOAD_DIR, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(VIDEO_LECTURES_UPLOAD_DIR)) {
      fs.mkdirSync(VIDEO_LECTURES_UPLOAD_DIR, { recursive: true });
    }
    cb(null, VIDEO_LECTURES_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    const sanitizedFilename = `vid-${timestamp}-${randomHex}-${baseName || 'lecture'}.mp4`;
    cb(null, sanitizedFilename);
  }
});

// File filter enforcing MP4 only
const mp4FileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isMp4Mime = file.mimetype === 'video/mp4';
  const hasMp4Ext = path.extname(file.originalname).toLowerCase() === '.mp4';

  if (isMp4Mime || hasMp4Ext) {
    cb(null, true);
  } else {
    cb(new Error('ONLY_MP4_ALLOWED'));
  }
};

export const videoLectureUpload = multer({
  storage: videoStorage,
  fileFilter: mp4FileFilter
});

export const removeVideoLectureFile = (filenameOrPath: string): void => {
  try {
    const filename = path.basename(filenameOrPath);
    const fullPath = path.join(VIDEO_LECTURES_UPLOAD_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`[FileStorage] Failed to remove video lecture file ${filenameOrPath}:`, err);
  }
};

export const getSafeVideoLectureFilePath = (filename: string): string | null => {
  const safeName = path.basename(filename);
  const candidateDirs = [
    VIDEO_LECTURES_UPLOAD_DIR,
    path.resolve(__dirname, '../../uploads/videos'),
    path.resolve(__dirname, '../../../uploads/videos'),
    path.resolve(process.cwd(), 'uploads/videos'),
    path.resolve(process.cwd(), 'backend/uploads/videos')
  ];

  for (const dir of candidateDirs) {
    const fullPath = path.join(dir, safeName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
};

// ============================================================================
// PROFILE AVATARS FILE STORAGE
// ============================================================================

export const AVATARS_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/avatars');

if (!fs.existsSync(AVATARS_UPLOAD_DIR)) {
  fs.mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(AVATARS_UPLOAD_DIR)) {
      fs.mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
    }
    cb(null, AVATARS_UPLOAD_DIR);
  },
  filename: (req: any, file, cb) => {
    const userId = req.user?.id || 'user';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `avatar-${userId}-${timestamp}${safeExt}`);
  }
});

const avatarFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('ONLY_IMAGE_ALLOWED'));
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

export const removeAvatarFile = (filenameOrPath: string): void => {
  try {
    const filename = path.basename(filenameOrPath);
    const candidateDirs = [
      AVATARS_UPLOAD_DIR,
      path.resolve(__dirname, '../../uploads/avatars'),
      path.resolve(__dirname, '../../../uploads/avatars'),
      path.resolve(process.cwd(), 'uploads/avatars'),
      path.resolve(process.cwd(), 'backend/uploads/avatars')
    ];
    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.warn(`[FileStorage] Failed to remove avatar file ${filenameOrPath}:`, err);
  }
};

// ==========================================
// 5. QUERY / QUESTION IMAGE STORAGE (Multimodal AI Input)
// ==========================================
export const QUERY_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/queries');

if (!fs.existsSync(QUERY_UPLOAD_DIR)) {
  fs.mkdirSync(QUERY_UPLOAD_DIR, { recursive: true });
}

const queryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(QUERY_UPLOAD_DIR)) {
      fs.mkdirSync(QUERY_UPLOAD_DIR, { recursive: true });
    }
    cb(null, QUERY_UPLOAD_DIR);
  },
  filename: (req: any, file, cb) => {
    const timestamp = Date.now();
    const userId = req.user?.id || 'guest';
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext) ? ext : '.jpg';
    cb(null, `query-${userId}-${timestamp}${safeExt}`);
  }
});

const queryFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/bmp'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('ONLY_IMAGE_ALLOWED'));
  }
};

export const queryUpload = multer({
  storage: queryStorage,
  fileFilter: queryFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB
  }
});

export const removeQueryFile = (filenameOrPath: string): void => {
  try {
    if (!filenameOrPath) return;
    const filename = path.basename(filenameOrPath);
    const candidateDirs = [
      QUERY_UPLOAD_DIR,
      path.resolve(__dirname, '../../uploads/queries'),
      path.resolve(__dirname, '../../../uploads/queries'),
      path.resolve(process.cwd(), 'uploads/queries'),
      path.resolve(process.cwd(), 'backend/uploads/queries')
    ];
    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.warn(`[FileStorage] Failed to remove query file ${filenameOrPath}:`, err);
  }
};

/**
 * Persist an uploaded file buffer into the database StoredFile table for durability across dyno restarts
 */
export async function persistFile(
  filePath: string,
  filename: string,
  mimeType: string,
  originalName?: string
): Promise<void> {
  try {
    if (!fs.existsSync(filePath)) return;
    const fileBuffer = fs.readFileSync(filePath);
    await (prisma as any).storedFile.upsert({
      where: { filename },
      create: {
        filename,
        originalName: originalName || path.basename(filePath),
        mimeType: mimeType || 'application/octet-stream',
        size: fileBuffer.length,
        data: fileBuffer
      },
      update: {
        originalName: originalName || path.basename(filePath),
        mimeType: mimeType || 'application/octet-stream',
        size: fileBuffer.length,
        data: fileBuffer
      }
    });
    console.log(`[FileStorage] Persisted ${filename} (${fileBuffer.length} bytes) to database.`);
  } catch (err: any) {
    console.warn(`[FileStorage] Failed to persist file ${filename} to database:`, err.message);
  }
}

/**
 * Ensures a file exists on disk, pulling it from the database if absent.
 * Returns the full path to the local cached file, or null if not found.
 */
export async function ensureFileOnDisk(
  filename: string,
  targetDir: string
): Promise<string | null> {
  if (!filename) return null;
  const safeName = path.basename(filename);
  const fullPath = path.join(targetDir, safeName);

  // If already on disk, return immediately
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  // Not on disk (e.g. dyno restart) -> fetch from database
  try {
    const record = await (prisma as any).storedFile.findUnique({
      where: { filename: safeName }
    });

    if (record && record.data) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, record.data);
      console.log(`[FileStorage] Restored ${safeName} (${record.size || record.data.length} bytes) from database to disk.`);
      return fullPath;
    }
  } catch (err: any) {
    console.warn(`[FileStorage] Failed to restore file ${safeName} from database:`, err.message);
  }

  return null;
}

/**
 * Remove file from disk AND database
 */
export async function deletePersistedFile(
  filenameOrPath: string,
  dir: string
): Promise<void> {
  if (!filenameOrPath) return;
  const filename = path.basename(filenameOrPath);
  const fullPath = path.join(dir, filename);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err: any) {
    console.warn(`[FileStorage] Failed to delete disk file ${fullPath}:`, err.message);
  }
  try {
    await (prisma as any).storedFile.deleteMany({ where: { filename } });
  } catch (err: any) {
    console.warn(`[FileStorage] Failed to delete database StoredFile ${filename}:`, err.message);
  }
}
