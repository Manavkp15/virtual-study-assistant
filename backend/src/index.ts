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
    system: 'Virtual Study Assistant Backend API',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
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
  console.log(`🚀 Virtual Study Assistant Backend server running on http://0.0.0.0:${PORT}`);
});
