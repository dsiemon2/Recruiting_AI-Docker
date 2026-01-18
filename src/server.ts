import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pino from 'pino';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import cookieParser from 'cookie-parser';
import path from 'path';

// API Routes
import authRouter from './routes/auth.js';
import authViewsRouter from './routes/authViews.js';
import oauthRouter from './routes/oauth.js';
import jobRolesRouter from './routes/jobRoles.js';
import questionsRouter from './routes/questions.js';
import interviewsRouter from './routes/interviews.js';
import teamsRouter from './routes/teams.js';
import healthRouter from './routes/health.js';
import interviewSessionRouter from './routes/interviewSession.js';
import passport from 'passport';

// Real-time handlers
import { handleInterviewConnection } from './realtime/interviewHandler.js';

const app = express();
const logger = pino();

// Base path for Docker nginx proxy
const basePath = '/RecruitingAI';

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(passport.initialize());

app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/job-roles', jobRolesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/teams', teamsRouter);

// Health check
app.use('/healthz', healthRouter);

// Auth view routes (login, register, etc.)
app.use('/auth', authViewsRouter);

// Interview session routes (candidate-facing)
app.use('/interview', interviewSessionRouter);

// Main page - Professional Landing Page
app.get('/', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const [branding, storeInfo] = await Promise.all([
      prisma.branding.findFirst(),
      prisma.storeInfo.findFirst(),
    ]);

    await prisma.$disconnect();

    res.render('index', {
      appName: storeInfo?.businessName || 'AI Recruiting Assistant',
      branding: branding || {},
      storeInfo: storeInfo || {},
      basePath,
    });
  } catch (error) {
    res.render('index', {
      appName: 'AI Recruiting Assistant',
      branding: {},
      storeInfo: {},
      basePath,
    });
  }
});

// Login page
app.get('/login', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const [branding, storeInfo] = await Promise.all([
      prisma.branding.findFirst(),
      prisma.storeInfo.findFirst(),
    ]);

    await prisma.$disconnect();

    res.render('login', {
      appName: storeInfo?.businessName || 'AI Recruiting Assistant',
      branding: branding || {},
      storeInfo: storeInfo || {},
      basePath,
    });
  } catch (error) {
    res.render('login', {
      appName: 'AI Recruiting Assistant',
      branding: {},
      storeInfo: {},
      basePath,
    });
  }
});

// Registration page
app.get('/register', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const [branding, storeInfo] = await Promise.all([
      prisma.branding.findFirst(),
      prisma.storeInfo.findFirst(),
    ]);

    await prisma.$disconnect();

    res.render('register', {
      appName: storeInfo?.businessName || 'AI Recruiting Assistant',
      branding: branding || {},
      storeInfo: storeInfo || {},
      basePath,
    });
  } catch (error) {
    res.render('register', {
      appName: 'AI Recruiting Assistant',
      branding: {},
      storeInfo: {},
      basePath,
    });
  }
});

// Chat/Interview Interface
app.get('/chat', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const [branding, storeInfo] = await Promise.all([
      prisma.branding.findFirst(),
      prisma.storeInfo.findFirst(),
    ]);

    await prisma.$disconnect();

    res.render('chat', {
      appName: storeInfo?.businessName || 'AI Recruiting Assistant',
      branding: branding || {},
      storeInfo: storeInfo || {},
      basePath,
    });
  } catch (error) {
    res.render('chat', {
      appName: 'AI Recruiting Assistant',
      branding: {},
      storeInfo: {},
      basePath,
    });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 8010;
const server = http.createServer(app);

// WebSocket server for real-time interview (Phase 3)
const interviewWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url || '');

  if (pathname === '/ws/interview') {
    interviewWss.handleUpgrade(request, socket, head, (ws) => {
      interviewWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Real-time interview WebSocket handler
interviewWss.on('connection', (ws: WebSocket, request) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');
  const role = url.searchParams.get('role') as 'candidate' | 'manager';

  if (!token || !role) {
    ws.send(JSON.stringify({ type: 'error', data: { message: 'Missing token or role' } }));
    ws.close();
    return;
  }

  // Validate admin token for manager role
  if (role === 'manager') {
    const adminToken = url.searchParams.get('adminToken');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Unauthorized' } }));
      ws.close();
      return;
    }
  }

  handleInterviewConnection(ws, request, token, role);
});

server.listen(port, () => {
  logger.info(`AI Recruiting Assistant running on :${port}`);
  logger.info(`Interview interface: http://localhost:${port}/`);
  logger.info(`WebSocket: ws://localhost:${port}/ws/interview`);
});
