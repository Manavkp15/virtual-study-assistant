import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './database/prisma';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import testRoutes from './routes/test.routes';
import mistakeRoutes from './routes/mistake.routes';
import studyPlanRoutes from './routes/studyPlan.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import homeworkRoutes from './routes/homework.routes';
import studyMaterialRoutes from './routes/studyMaterial.routes';
import videoLectureRoutes from './routes/videoLecture.routes';
import ragRoutes from './routes/rag.routes';
import remedialRoutes from './routes/remedial.routes';
import speechRoutes from './routes/speech.routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Dynamic CORS configuration supporting standalone frontend or unified service
const corsOrigin = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : true;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));

app.use(express.json());

// API Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/video-lectures', videoLectureRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/remedial', remedialRoutes);
app.use('/api/speech', speechRoutes);

// Static uploads serving for videos (with range support handled natively by express.static)
const candidateVideoDirs = [
  path.resolve(__dirname, '../uploads/videos'),
  path.resolve(__dirname, '../../uploads/videos'),
  path.resolve(process.cwd(), 'uploads/videos'),
  path.resolve(process.cwd(), 'backend/uploads/videos')
];
const videoUploadDir = candidateVideoDirs.find(d => fs.existsSync(d));
if (videoUploadDir) {
  app.use('/uploads/videos', express.static(videoUploadDir));
}

// Static uploads serving for profile avatars
const candidateAvatarDirs = [
  path.resolve(__dirname, '../uploads/avatars'),
  path.resolve(__dirname, '../../uploads/avatars'),
  path.resolve(process.cwd(), 'uploads/avatars'),
  path.resolve(process.cwd(), 'backend/uploads/avatars')
];
const avatarUploadDir = candidateAvatarDirs.find(d => fs.existsSync(d)) || path.resolve(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}
app.use('/uploads/avatars', express.static(avatarUploadDir));
// Health check endpoint with database connectivity check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'CONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = `DISCONNECTED (${err.message})`;
  }
  res.json({
    status: 'ONLINE',
    system: 'VM જ્ઞાનસેતુ Backend API',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'ONLY_PDF_ALLOWED') {
    return res.status(400).json({ error: 'Only PDF documents (.pdf) are allowed' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error('API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Production Static Serving for Single-Service Deployment on Render
const candidateDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, './public'),
  path.resolve(__dirname, '../../../frontend/dist')
];

const staticDistPath = candidateDistPaths.find(p => fs.existsSync(p));

if (staticDistPath) {
  console.log(`📦 Serving frontend static assets from: ${staticDistPath}`);
  app.use(express.static(staticDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VM જ્ઞાનસેતુ Backend server running on http://0.0.0.0:${PORT}`);
});
