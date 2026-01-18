import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pino from 'pino';
import cookieParser from 'cookie-parser';
import path from 'path';

// API Routes
import authRouter from './routes/auth.js';
import superAdminRouter from './routes/superAdmin.js';
import usersRouter from './routes/users.js';
import jobRolesRouter from './routes/jobRoles.js';
import questionsRouter from './routes/questions.js';
import interviewsRouter from './routes/interviews.js';

// Legacy admin routes (will be replaced)
import adminRouter from './routes/admin.js';

const app = express();
const logger = pino();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/users', usersRouter);
app.use('/api/job-roles', jobRolesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/interviews', interviewsRouter);

// Legacy admin routes (for UI)
app.use('/admin', adminRouter);

// Redirect root to admin
app.get('/', (req, res) => {
  const token = process.env.ADMIN_TOKEN || 'admin';
  res.redirect(`/admin?token=${token}`);
});

// Health check
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', app: 'AI Recruiting Assistant' });
});

const port = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 8011;

app.listen(port, () => {
  logger.info(`AI Recruiting Assistant - Admin Panel running on :${port}`);
  logger.info(`Admin URL: http://localhost:${port}/admin?token=${process.env.ADMIN_TOKEN || 'admin'}`);
  logger.info(`API Base: http://localhost:${port}/api`);
});
