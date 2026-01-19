import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import pino from 'pino';
import multer from 'multer';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/index.js';
import { JwtPayload, SuperAdminJwtPayload } from '../types/index.js';

const router = Router();
const logger = pino();

// Base path for Docker deployment
const basePath = '/RecruitingAI';

// Extend Request to include auth info
interface AdminRequest extends Request {
  userRole?: string;
  userId?: string;
  companyId?: string;
  userEmail?: string;
  userName?: string;
}

// Helper function to get branding (with Teal defaults)
async function getBranding() {
  const branding = await prisma.branding.findFirst();
  return branding || { primaryColor: '#0d9488', secondaryColor: '#0f766e', accentColor: '#14b8a6' };
}

// Helper to get user role from authenticated request
function getUserRole(req: AdminRequest): string {
  return req.userRole || 'CANDIDATE';
}

// Common view data helper
async function getViewData(req: AdminRequest, res: Response, active?: string) {
  const branding = await getBranding();
  return {
    token: res.locals.token,
    basePath,
    branding,
    userRole: getUserRole(req),
    userId: req.userId,
    userEmail: req.userEmail,
    userName: req.userName,
    active: active || '',
  };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.docx', '.xlsx', '.xls'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and Word files are allowed'));
    }
  },
});

// Auth middleware - supports JWT tokens, legacy admin token, and cookies
async function requireToken(req: AdminRequest, res: Response, next: NextFunction) {
  const queryToken = req.query.token as string;
  const cookieToken = req.cookies?.authToken;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = bearerToken || queryToken || cookieToken;
  const legacyAdminToken = process.env.ADMIN_TOKEN || 'admin';

  // 1. Check for legacy admin token (Super Admin access)
  if (token === legacyAdminToken) {
    req.userRole = 'SUPER_ADMIN';
    req.userId = 'system';
    req.userEmail = 'admin@system.local';
    req.userName = 'System Admin';
    res.locals.token = token;
    return next();
  }

  // 2. Try to validate as JWT
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JwtPayload | SuperAdminJwtPayload;

      // Check if it's a Super Admin JWT
      if ('superAdminId' in payload && payload.role === 'SUPER_ADMIN') {
        req.userRole = 'SUPER_ADMIN';
        req.userId = payload.superAdminId;
        req.userEmail = payload.email;

        // Get Super Admin name from database
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { id: payload.superAdminId },
          select: { name: true }
        });
        req.userName = superAdmin?.name || 'Super Admin';
        res.locals.token = token;
        return next();
      }

      // Regular user JWT
      if ('userId' in payload && payload.companyId) {
        req.userRole = payload.role;
        req.userId = payload.userId;
        req.companyId = payload.companyId;
        req.userEmail = payload.email;

        // Get user name from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { name: true }
        });
        req.userName = user?.name || 'User';
        res.locals.token = token;
        return next();
      }
    } catch (error) {
      // JWT verification failed, continue to unauthorized
      if (error instanceof jwt.TokenExpiredError) {
        return res.redirect(`${basePath}/auth/login?expired=true`);
      }
    }
  }

  // No valid token found - redirect to login
  return res.redirect(`${basePath}/auth/login`);
}

router.use(requireToken);

// Dashboard
router.get('/', async (req, res) => {
  try {
    // Get first company for demo (in production, this would come from auth)
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const viewData = await getViewData(req, res, 'dashboard');

    // Stats
    const [totalInterviews, scheduledInterviews, completedInterviews, jobRoleCount] = await Promise.all([
      prisma.interview.count({ where: companyId ? { companyId } : undefined }),
      prisma.interview.count({ where: { status: 'SCHEDULED', ...(companyId ? { companyId } : {}) } }),
      prisma.interview.count({ where: { status: 'COMPLETED', ...(companyId ? { companyId } : {}) } }),
      prisma.jobRole.count({ where: { isActive: true, ...(companyId ? { companyId } : {}) } }),
    ]);

    // Upcoming interviews
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
      include: {
        jobRole: { select: { title: true } },
      },
    });

    res.render('admin/dashboard', {
      ...viewData,
      stats: {
        totalInterviews,
        scheduledInterviews,
        completedInterviews,
        jobRoleCount,
      },
      upcomingInterviews,
    });
  } catch (err) {
    logger.error({ err }, 'Dashboard error');
    const viewData = await getViewData(req, res);
    res.render('admin/error', { ...viewData, error: 'Failed to load dashboard' });
  }
});

// Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    if (!companyId) {
      return res.render('admin/error', { error: 'No company found', token: res.locals.token, basePath });
    }

    // Get date range from query params
    const daysParam = parseInt(req.query.days as string) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysParam);

    // Basic stats
    const [totalInterviews, completedInterviews, scheduledInterviews, cancelledInterviews] = await Promise.all([
      prisma.interview.count({ where: { companyId } }),
      prisma.interview.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.interview.count({ where: { companyId, status: 'SCHEDULED' } }),
      prisma.interview.count({ where: { companyId, status: 'CANCELLED' } }),
    ]);

    // By recommendation
    const byRecommendation = await prisma.interviewResult.groupBy({
      by: ['recommendation'],
      where: {
        interview: { companyId },
        recommendation: { not: null },
      },
      _count: true,
    });

    // By job role
    const byJobRole = await prisma.interview.groupBy({
      by: ['jobRoleId'],
      where: { companyId },
      _count: true,
    });

    // Get job role names
    const jobRoleIds = byJobRole.map((j) => j.jobRoleId);
    const jobRoles = await prisma.jobRole.findMany({
      where: { id: { in: jobRoleIds } },
      select: { id: true, title: true },
    });
    const jobRoleMap = Object.fromEntries(jobRoles.map((j) => [j.id, j.title]));

    // Average score
    const avgScore = await prisma.interviewResult.aggregate({
      where: {
        interview: { companyId },
        overallScore: { not: null },
      },
      _avg: { overallScore: true },
    });

    // Recent completed interviews
    const recentCompleted = await prisma.interview.findMany({
      where: { companyId, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        jobRole: { select: { title: true } },
        result: { select: { overallScore: true, recommendation: true, summary: true } },
      },
    });

    // Top candidates (strong yes/yes with score >= 4)
    const topCandidates = await prisma.interviewResult.findMany({
      where: {
        interview: { companyId, status: 'COMPLETED' },
        overallScore: { gte: 4 },
        recommendation: { in: ['STRONG_YES', 'YES'] },
      },
      select: {
        overallScore: true,
        recommendation: true,
        interview: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            jobRole: { select: { title: true } },
            updatedAt: true,
          },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: 10,
    });

    // By mode
    const byMode = await prisma.interview.groupBy({
      by: ['mode'],
      where: { companyId },
      _count: true,
    });

    res.render('admin/analytics', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      company,
      days: daysParam,
      stats: {
        totalInterviews,
        completedInterviews,
        scheduledInterviews,
        cancelledInterviews,
        completionRate: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0,
        averageScore: avgScore._avg.overallScore ? avgScore._avg.overallScore.toFixed(1) : 'N/A',
      },
      byRecommendation: Object.fromEntries(byRecommendation.map((r) => [r.recommendation || 'NONE', r._count])),
      byJobRole: byJobRole.map((j) => ({
        title: jobRoleMap[j.jobRoleId] || 'Unknown',
        count: j._count,
      })),
      byMode: Object.fromEntries(byMode.map((m) => [m.mode, m._count])),
      recentCompleted,
      topCandidates: topCandidates.map((tc) => ({
        interviewId: tc.interview.id,
        candidateName: tc.interview.candidateName,
        candidateEmail: tc.interview.candidateEmail,
        jobRole: tc.interview.jobRole.title,
        score: tc.overallScore,
        recommendation: tc.recommendation,
        completedAt: tc.interview.updatedAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, 'Analytics error');
    res.render('admin/error', { error: 'Failed to load analytics', token: res.locals.token, basePath });
  }
});

// Companies (Super Admin)
router.get('/companies', async (req, res) => {
  try {
    const branding = await getBranding();
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, jobRoles: true, interviews: true },
        },
      },
    });

    res.render('admin/companies', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      companies,
      total: companies.length,
    });
  } catch (err) {
    logger.error({ err }, 'Companies error');
    res.render('admin/error', { error: 'Failed to load companies', token: res.locals.token, basePath });
  }
});

// Users
router.get('/users', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    const users = companyId
      ? await prisma.user.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    res.render('admin/users', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      users,
      total: users.length,
      company,
    });
  } catch (err) {
    logger.error({ err }, 'Users error');
    res.render('admin/error', { error: 'Failed to load users', token: res.locals.token, basePath });
  }
});

// Candidates
router.get('/candidates', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    // Get all interviews with candidate info
    const interviews = companyId
      ? await prisma.interview.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          include: {
            jobRole: { select: { id: true, title: true } },
            result: { select: { overallScore: true, recommendation: true } },
          },
        })
      : [];

    // Group by unique candidates (by email)
    const candidateMap = new Map<string, {
      email: string;
      name: string;
      phone: string;
      interviews: typeof interviews;
      lastInterview: Date | null;
      totalInterviews: number;
      averageScore: number | null;
      latestStatus: string;
      latestRecommendation: string | null;
    }>();

    for (const interview of interviews) {
      const email = interview.candidateEmail.toLowerCase();
      const existing = candidateMap.get(email);

      if (existing) {
        existing.interviews.push(interview);
        existing.totalInterviews++;
        if (interview.updatedAt > (existing.lastInterview || new Date(0))) {
          existing.lastInterview = interview.updatedAt;
          existing.latestStatus = interview.status;
          existing.latestRecommendation = interview.result?.recommendation || null;
        }
        // Update average score
        const scores = existing.interviews
          .filter(i => i.result?.overallScore)
          .map(i => i.result!.overallScore!);
        existing.averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      } else {
        candidateMap.set(email, {
          email: interview.candidateEmail,
          name: interview.candidateName,
          phone: interview.candidatePhone || '',
          interviews: [interview],
          lastInterview: interview.updatedAt,
          totalInterviews: 1,
          averageScore: interview.result?.overallScore || null,
          latestStatus: interview.status,
          latestRecommendation: interview.result?.recommendation || null,
        });
      }
    }

    const candidates = Array.from(candidateMap.values())
      .sort((a, b) => (b.lastInterview?.getTime() || 0) - (a.lastInterview?.getTime() || 0));

    res.render('admin/candidates', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      candidates,
      total: candidates.length,
      company,
    });
  } catch (err) {
    logger.error({ err }, 'Candidates error');
    res.render('admin/error', { error: 'Failed to load candidates', token: res.locals.token, basePath });
  }
});

// Job Roles
router.get('/job-roles', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    const jobRoles = companyId
      ? await prisma.jobRole.findMany({
          where: { companyId },
          orderBy: { title: 'asc' },
          include: {
            _count: { select: { categories: true, interviews: true } },
          },
        })
      : [];

    res.render('admin/job-roles', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      jobRoles,
      total: jobRoles.length,
      company,
    });
  } catch (err) {
    logger.error({ err }, 'Job roles error');
    res.render('admin/error', { error: 'Failed to load job roles', token: res.locals.token, basePath });
  }
});

// Job Role Detail
router.get('/job-roles/:id', async (req, res) => {
  try {
    const branding = await getBranding();
    const jobRole = await prisma.jobRole.findUnique({
      where: { id: req.params.id },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        company: true,
      },
    });

    if (!jobRole) {
      return res.render('admin/error', { error: 'Job role not found', token: res.locals.token, basePath });
    }

    // Parse followUps JSON
    const jobRoleWithParsed = {
      ...jobRole,
      categories: jobRole.categories.map(cat => ({
        ...cat,
        questions: cat.questions.map(q => ({
          ...q,
          followUps: JSON.parse(q.followUps) as string[],
        })),
      })),
    };

    res.render('admin/job-role-detail', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      jobRole: jobRoleWithParsed,
    });
  } catch (err) {
    logger.error({ err }, 'Job role detail error');
    res.render('admin/error', { error: 'Failed to load job role', token: res.locals.token, basePath });
  }
});

// Questions
router.get('/questions', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    const jobRoles = companyId
      ? await prisma.jobRole.findMany({
          where: { companyId, isActive: true },
          orderBy: { title: 'asc' },
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        })
      : [];

    // Parse followUps
    const jobRolesWithParsed = jobRoles.map(jr => ({
      ...jr,
      categories: jr.categories.map(cat => ({
        ...cat,
        questions: cat.questions.map(q => ({
          ...q,
          followUps: JSON.parse(q.followUps) as string[],
        })),
      })),
    }));

    res.render('admin/questions', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      jobRoles: jobRolesWithParsed,
      company,
    });
  } catch (err) {
    logger.error({ err }, 'Questions error');
    res.render('admin/error', { error: 'Failed to load questions', token: res.locals.token, basePath });
  }
});

// Add single question
router.post('/questions', async (req, res) => {
  try {
    const { categoryId, text, followUps, evaluationCriteria, timeAllocation, isRequired, order } = req.body;

    const question = await prisma.question.create({
      data: {
        text,
        followUps: JSON.stringify(followUps || []),
        evaluationCriteria: evaluationCriteria || null,
        timeAllocation: timeAllocation || 5,
        isRequired: isRequired || false,
        order: order || 0,
        categoryId,
      },
    });

    res.json({ success: true, question });
  } catch (err) {
    logger.error({ err }, 'Add question error');
    res.status(500).json({ success: false, error: 'Failed to add question' });
  }
});

// Preview Word document for questions
router.post('/questions/preview-word', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    // Parse questions from the document
    const questions = parseQuestionsFromText(text);

    res.json({ success: true, questions });
  } catch (err) {
    logger.error({ err }, 'Word preview error');
    res.status(500).json({ error: 'Failed to parse Word document' });
  }
});

// Preview Excel file for questions
router.post('/questions/preview-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const questions = parseExcel(req.file.buffer);

    res.json({ success: true, questions });
  } catch (err) {
    logger.error({ err }, 'Excel preview error');
    res.status(500).json({ error: 'Failed to parse Excel file' });
  }
});

// Download Excel template
router.get('/questions/template.xlsx', (req, res) => {
  const workbook = XLSX.utils.book_new();

  const data = [
    ['Question', 'Followups', 'Time_Minutes', 'Required', 'Evaluation_Criteria'],
    ['Tell me about yourself', 'What are your strengths?;What motivates you?', 5, 'no', 'Looking for clear communication and self-awareness'],
    ['Describe a challenging project you worked on', 'How did you overcome obstacles?;What did you learn?', 8, 'yes', 'Problem-solving ability and growth mindset'],
    ['Why are you interested in this role?', 'What research have you done about our company?', 5, 'yes', 'Genuine interest and preparation'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 45 }, // Question
    { wch: 50 }, // Followups
    { wch: 14 }, // Time_Minutes
    { wch: 10 }, // Required
    { wch: 50 }, // Evaluation_Criteria
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="questions_template.xlsx"');
  res.send(buffer);
});

// Import questions from CSV or Word
router.post('/questions/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobRoleId, categoryId, newCategory, importType } = req.body;
    const company = await prisma.company.findFirst();

    if (!company) {
      return res.status(400).json({ error: 'No company found' });
    }

    // Determine or create category
    let targetCategoryId = categoryId;

    if (newCategory && newCategory.trim()) {
      // Create new category
      const category = await prisma.questionCategory.create({
        data: {
          name: newCategory.trim(),
          order: 0,
          jobRoleId,
          companyId: company.id,
        },
      });
      targetCategoryId = category.id;
    }

    if (!targetCategoryId) {
      return res.status(400).json({ error: 'Category is required' });
    }

    let questions: Array<{
      text: string;
      followUps: string[];
      timeAllocation: number;
      isRequired: boolean;
      evaluationCriteria: string;
    }> = [];

    if (importType === 'csv') {
      const csvText = req.file.buffer.toString('utf-8');
      questions = parseCSV(csvText);
    } else if (importType === 'excel') {
      questions = parseExcel(req.file.buffer);
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      questions = parseQuestionsFromText(result.value);
    }

    // Get current max order
    const maxOrder = await prisma.question.aggregate({
      where: { categoryId: targetCategoryId },
      _max: { order: true },
    });
    let currentOrder = (maxOrder._max.order || 0) + 1;

    // Create questions
    const created = [];
    for (const q of questions) {
      const question = await prisma.question.create({
        data: {
          text: q.text,
          followUps: JSON.stringify(q.followUps || []),
          evaluationCriteria: q.evaluationCriteria || null,
          timeAllocation: q.timeAllocation || 5,
          isRequired: q.isRequired || false,
          order: currentOrder++,
          categoryId: targetCategoryId,
        },
      });
      created.push(question);
    }

    res.json({ success: true, count: created.length });
  } catch (err) {
    logger.error({ err }, 'Import questions error');
    res.status(500).json({ success: false, error: 'Failed to import questions' });
  }
});

// Helper: Parse CSV
function parseCSV(text: string): Array<{
  text: string;
  followUps: string[];
  timeAllocation: number;
  isRequired: boolean;
  evaluationCriteria: string;
}> {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const questionText = row['question'] || row['text'] || row['q'] || '';
    if (!questionText.trim()) continue;

    const followUpsStr = row['followups'] || row['follow_ups'] || row['followup'] || '';
    const followUps = followUpsStr.split(';').map(f => f.trim()).filter(f => f);

    const timeStr = row['time_minutes'] || row['time'] || row['minutes'] || '5';
    const timeAllocation = parseInt(timeStr) || 5;

    const requiredStr = row['required'] || row['is_required'] || 'no';
    const isRequired = ['yes', 'true', '1'].includes(requiredStr.toLowerCase());

    const evaluationCriteria = row['evaluation_criteria'] || row['criteria'] || row['evaluation'] || '';

    questions.push({
      text: questionText.trim(),
      followUps,
      timeAllocation,
      isRequired,
      evaluationCriteria: evaluationCriteria.trim(),
    });
  }

  return questions;
}

// Helper: Parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Helper: Parse Excel file
function parseExcel(buffer: Buffer): Array<{
  text: string;
  followUps: string[];
  timeAllocation: number;
  isRequired: boolean;
  evaluationCriteria: string;
}> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON with headers
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const questions = [];

  for (const row of rows) {
    // Normalize column names (case-insensitive, handle variations)
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalized[key.toLowerCase().trim().replace(/\s+/g, '_')] = String(row[key] || '');
    }

    const questionText = normalized['question'] || normalized['text'] || normalized['q'] || normalized['question_text'] || '';
    if (!questionText.trim()) continue;

    const followUpsStr = normalized['followups'] || normalized['follow_ups'] || normalized['followup'] || normalized['follow-ups'] || '';
    const followUps = followUpsStr.split(/[;|]/).map(f => f.trim()).filter(f => f);

    const timeStr = normalized['time_minutes'] || normalized['time'] || normalized['minutes'] || normalized['duration'] || '5';
    const timeAllocation = parseInt(timeStr) || 5;

    const requiredStr = normalized['required'] || normalized['is_required'] || normalized['mandatory'] || 'no';
    const isRequired = ['yes', 'true', '1', 'y'].includes(requiredStr.toLowerCase());

    const evaluationCriteria = normalized['evaluation_criteria'] || normalized['criteria'] || normalized['evaluation'] || normalized['scoring'] || '';

    questions.push({
      text: questionText.trim(),
      followUps,
      timeAllocation,
      isRequired,
      evaluationCriteria: evaluationCriteria.trim(),
    });
  }

  return questions;
}

// Helper: Parse questions from plain text (Word document)
function parseQuestionsFromText(text: string): Array<{
  text: string;
  followUps: string[];
  timeAllocation: number;
  isRequired: boolean;
  evaluationCriteria: string;
}> {
  const lines = text.split('\n').filter(l => l.trim());
  const questions: Array<{
    text: string;
    followUps: string[];
    timeAllocation: number;
    isRequired: boolean;
    evaluationCriteria: string;
  }> = [];

  let currentQuestion: {
    text: string;
    followUps: string[];
    timeAllocation: number;
    isRequired: boolean;
    evaluationCriteria: string;
  } | null = null;

  // Patterns for detecting questions
  const questionPatterns = [
    /^\d+[\.\)]\s*(.+)/,           // 1. Question or 1) Question
    /^[-•*]\s*(.+)/,               // - Question or • Question
    /^Q[\.:]\s*(.+)/i,             // Q: Question or Q. Question
    /^Question\s*\d*[\.:]\s*(.+)/i, // Question 1: ...
  ];

  // Patterns for follow-ups (indented or sub-bullets)
  const followUpPatterns = [
    /^\s{2,}[-•*]\s*(.+)/,         // Indented bullet
    /^\s{2,}[a-z][\.\)]\s*(.+)/,   // a. or a)
    /^\s+Follow.?up:\s*(.+)/i,     // Follow-up:
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's a main question
    let isQuestion = false;
    let questionText = '';

    for (const pattern of questionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        isQuestion = true;
        questionText = match[1] || trimmed;
        break;
      }
    }

    // Check if line ends with a question mark (likely a question)
    if (!isQuestion && trimmed.endsWith('?') && trimmed.length > 20) {
      isQuestion = true;
      questionText = trimmed;
    }

    if (isQuestion) {
      // Save previous question
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: questionText,
        followUps: [],
        timeAllocation: 5,
        isRequired: false,
        evaluationCriteria: '',
      };
    } else if (currentQuestion) {
      // Check if it's a follow-up
      let isFollowUp = false;
      let followUpText = '';

      for (const pattern of followUpPatterns) {
        const match = line.match(pattern);
        if (match) {
          isFollowUp = true;
          followUpText = match[1] || trimmed;
          break;
        }
      }

      // Also treat sub-items as follow-ups
      if (!isFollowUp && line.startsWith('  ') && trimmed.endsWith('?')) {
        isFollowUp = true;
        followUpText = trimmed;
      }

      if (isFollowUp && followUpText) {
        currentQuestion.followUps.push(followUpText);
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
}

// Interviews
router.get('/interviews', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    const status = req.query.status as string;
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    if (status && ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      where.status = status;
    }

    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        jobRole: { select: { id: true, title: true } },
        sessions: {
          include: {
            manager: { select: { id: true, name: true } },
          },
        },
        result: {
          select: { overallScore: true, recommendation: true },
        },
      },
    });

    res.render('admin/interviews', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      interviews,
      total: interviews.length,
      currentStatus: status || 'all',
      company,
    });
  } catch (err) {
    logger.error({ err }, 'Interviews error');
    res.render('admin/error', { error: 'Failed to load interviews', token: res.locals.token, basePath });
  }
});

// New Interview Form
router.get('/interviews/new', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    const jobRoles = companyId
      ? await prisma.jobRole.findMany({
          where: { companyId, isActive: true },
          orderBy: { title: 'asc' },
        })
      : [];

    const managers = companyId
      ? await prisma.user.findMany({
          where: { companyId, isActive: true },
          orderBy: { name: 'asc' },
        })
      : [];

    res.render('admin/interview-new', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      jobRoles,
      managers,
      company,
    });
  } catch (err) {
    logger.error({ err }, 'New interview form error');
    res.render('admin/error', { error: 'Failed to load form', token: res.locals.token, basePath });
  }
});

// Interview Detail
router.get('/interviews/:id', async (req, res) => {
  try {
    const branding = await getBranding();
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: {
        jobRole: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        sessions: {
          include: {
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        result: true,
        company: true,
      },
    });

    if (!interview) {
      return res.render('admin/error', { error: 'Interview not found', token: res.locals.token, basePath });
    }

    // Parse JSON fields
    const interviewParsed = {
      ...interview,
      jobRole: {
        ...interview.jobRole,
        categories: interview.jobRole.categories.map(cat => ({
          ...cat,
          questions: cat.questions.map(q => ({
            ...q,
            followUps: JSON.parse(q.followUps) as string[],
          })),
        })),
      },
      result: interview.result
        ? {
            ...interview.result,
            scorecard: JSON.parse(interview.result.scorecard),
          }
        : null,
    };

    res.render('admin/interview-detail', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      interview: interviewParsed,
    });
  } catch (err) {
    logger.error({ err }, 'Interview detail error');
    res.render('admin/error', { error: 'Failed to load interview', token: res.locals.token, basePath });
  }
});

// Greeting
router.get('/greeting', async (req, res) => {
  try {
    const config = await prisma.appConfig.findFirst();
    const branding = await getBranding();
    res.render('admin/greeting', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      active: 'greeting',
      greeting: config?.greeting || "Hello and welcome! I'm your AI interview assistant. Thank you for taking the time to interview with us today. I'll be guiding you through a series of questions to learn more about your experience and qualifications. Feel free to take your time with each response. Are you ready to begin?",
    });
  } catch (err) {
    logger.error({ err }, 'Greeting page error');
    res.render('admin/error', { error: 'Failed to load greeting config', token: res.locals.token, basePath });
  }
});

router.post('/greeting', async (req, res) => {
  try {
    const { greeting } = req.body;
    await prisma.appConfig.updateMany({
      data: { greeting }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Greeting update error');
    res.status(500).json({ success: false, error: 'Failed to update greeting' });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    const branding = await getBranding();
    const storeInfo = await prisma.storeInfo.findFirst();
    const paymentSettings = await prisma.paymentSettings.findFirst();

    res.render('admin/settings', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      storeInfo,
      paymentSettings,
    });
  } catch (err) {
    logger.error({ err }, 'Settings error');
    res.render('admin/error', { error: 'Failed to load settings', token: res.locals.token, basePath });
  }
});

// Settings - Store Info POST
router.post('/settings/store-info', async (req, res) => {
  try {
    const { businessName, tagline, description, address, phone, email, website, businessHours, timezone } = req.body;

    const existing = await prisma.storeInfo.findFirst();
    if (existing) {
      await prisma.storeInfo.update({
        where: { id: existing.id },
        data: { businessName, tagline, description, address, phone, email, website, businessHours, timezone },
      });
    } else {
      await prisma.storeInfo.create({
        data: { businessName, tagline, description, address, phone, email, website, businessHours, timezone },
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Store info save error');
    res.status(500).json({ success: false, error: 'Failed to save store info' });
  }
});

// Settings - Branding POST
router.post('/settings/branding', async (req, res) => {
  try {
    const { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont } = req.body;

    const existing = await prisma.branding.findFirst();
    if (existing) {
      await prisma.branding.update({
        where: { id: existing.id },
        data: { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont },
      });
    } else {
      await prisma.branding.create({
        data: { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, headingFont, bodyFont },
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Branding save error');
    res.status(500).json({ success: false, error: 'Failed to save branding' });
  }
});

// Settings - Payment Settings POST
router.post('/settings/payments', async (req, res) => {
  try {
    const {
      enabled, stripeEnabled, stripePublishableKey, stripeTestMode,
      paypalEnabled, paypalClientId, paypalSandbox,
      squareEnabled, squareAppId, squareSandbox
    } = req.body;

    const existing = await prisma.paymentSettings.findFirst();
    if (existing) {
      await prisma.paymentSettings.update({
        where: { id: existing.id },
        data: {
          enabled, stripeEnabled, stripePublishableKey, stripeTestMode,
          paypalEnabled, paypalClientId, paypalSandbox,
          squareEnabled, squareAppId, squareSandbox
        },
      });
    } else {
      await prisma.paymentSettings.create({
        data: {
          enabled, stripeEnabled, stripePublishableKey, stripeTestMode,
          paypalEnabled, paypalClientId, paypalSandbox,
          squareEnabled, squareAppId, squareSandbox
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Payment settings save error');
    res.status(500).json({ success: false, error: 'Failed to save payment settings' });
  }
});

// AI Config
router.get('/ai-config', async (req, res) => {
  try {
    const config = await prisma.appConfig.findFirst();
    const branding = await getBranding();
    res.render('admin/ai-config', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      config,
    });
  } catch (err) {
    logger.error({ err }, 'AI Config error');
    res.render('admin/error', { error: 'Failed to load AI config', token: res.locals.token, basePath });
  }
});

// AI Agents
router.get('/ai-agents', async (req, res) => {
  try {
    const agents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const branding = await getBranding();
    res.render('admin/ai-agents', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      agents,
    });
  } catch (err) {
    logger.error({ err }, 'AI Agents error');
    res.render('admin/error', { error: 'Failed to load AI agents', token: res.locals.token, basePath });
  }
});

// AI Tools
router.get('/ai-tools', async (req, res) => {
  try {
    const tools = await prisma.aITool.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const branding = await getBranding();
    res.render('admin/ai-tools', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      tools,
    });
  } catch (err) {
    logger.error({ err }, 'AI Tools error');
    res.render('admin/error', { error: 'Failed to load AI tools', token: res.locals.token, basePath });
  }
});

// ============================================
// Voices & Languages Configuration
// ============================================

router.get('/voices', async (req, res) => {
  try {
    const config = await prisma.appConfig.findFirst();
    const branding = await getBranding();

    let languages = await prisma.language.findMany({
      orderBy: { name: 'asc' }
    });

    // Create all 24 languages if none exist (all enabled by default)
    if (languages.length === 0) {
      const defaultLangs = [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', enabled: true },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', enabled: true },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: true },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', enabled: true },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', enabled: true },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', enabled: true },
        { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', flag: '🇨🇳', enabled: true },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', enabled: true },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', enabled: true },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', enabled: true },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', enabled: true },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', enabled: true },
        { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', enabled: true },
        { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', enabled: true },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', enabled: true },
        { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', enabled: true },
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', enabled: true },
        { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', enabled: true },
        { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', enabled: true },
        { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', enabled: true },
        { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', enabled: true },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', enabled: true },
        { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', enabled: true },
        { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', enabled: true },
      ];

      for (const lang of defaultLangs) {
        await prisma.language.create({ data: lang });
      }

      languages = await prisma.language.findMany({
        orderBy: { name: 'asc' }
      });
    }

    // Add docCount for each language (matching SellMeACar pattern)
    const languagesWithDocs = languages.map(lang => ({
      ...lang,
      docCount: 0
    }));
    res.render('admin/voices', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      active: 'voices',
      config: config || { selectedVoice: 'alloy', interviewMode: 'hybrid', maxInterviewMins: 60, difficulty: 'medium' },
      languages: languagesWithDocs,
      totalDocs: 0
    });
  } catch (err) {
    logger.error({ err }, 'Voices page error');
    res.render('admin/error', { error: 'Failed to load voices config', token: res.locals.token, basePath });
  }
});

router.post('/voices/select', async (req, res) => {
  try {
    const { voice } = req.body;
    await prisma.appConfig.updateMany({
      data: { selectedVoice: voice }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Voice select error');
    res.status(500).json({ success: false, error: 'Failed to update voice' });
  }
});

router.post('/voices/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['ai_only', 'hybrid'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid mode' });
    }
    await prisma.appConfig.updateMany({
      data: { interviewMode: mode }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Mode update error');
    res.status(500).json({ success: false, error: 'Failed to update mode' });
  }
});
router.post('/voices/difficulty', async (req, res) => {  try {    const { difficulty } = req.body;    if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {      return res.status(400).json({ success: false, error: 'Invalid difficulty' });    }    res.json({ success: true });  } catch (err) {    logger.error({ err }, 'Difficulty update error');    res.status(500).json({ success: false, error: 'Failed to update difficulty' });  }});

router.post('/voices/language', async (req, res) => {
  try {
    const { code } = req.body;

    // Language data mapping (all 24 languages)
    const langData: Record<string, { name: string; nativeName: string; flag: string }> = {
      en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
      es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
      pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
      zh: { name: 'Chinese (Mandarin)', nativeName: '中文', flag: '🇨🇳' },
      ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
      ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
      ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
      hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
      pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
      nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
      uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
      tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
      th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
      sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
      cs: { name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
      el: { name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
      he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
      id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
      fil: { name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
    };

    const data = langData[code];
    if (!data) {
      return res.redirect(`/admin/voices?token=${res.locals.token}&error=Invalid language code`);
    }

    const existing = await prisma.language.findUnique({ where: { code } });
    if (existing) {
      return res.redirect(`/admin/voices?token=${res.locals.token}&error=Language already exists`);
    }

    await prisma.language.create({
      data: { code, ...data, enabled: true }
    });
    res.redirect(`/admin/voices?token=${res.locals.token}`);
  } catch (err) {
    logger.error({ err }, 'Add language error');
    res.redirect(`/admin/voices?token=${res.locals.token}&error=Failed to add language`);
  }
});

router.post('/voices/language/:id', async (req, res) => {
  try {
    const { enabled } = req.body;
    await prisma.language.update({
      where: { id: req.params.id },
      data: { enabled: enabled === true || enabled === 'true' }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Toggle language error');
    res.status(500).json({ success: false, error: 'Failed to toggle language' });
  }
});

router.delete('/voices/language/:id', async (req, res) => {
  try {
    await prisma.language.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Delete language error');
    res.status(500).json({ success: false, error: 'Failed to delete language' });
  }
});

// ============================================
// Knowledge Base
// ============================================
router.get('/knowledge-base', async (req, res) => {
  try {
    const branding = await getBranding();
    const languages = await prisma.language.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' }
    });

    const currentLanguage = req.query.language as string || '';

    // Sample KB documents (in production, this would come from a KnowledgeDocument model)
    const sampleDocuments = [
      { id: 'kb-1', name: 'Interview Best Practices Guide', description: 'Complete guide for conducting effective interviews', type: 'pdf', size: '2.4 MB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-01'), content: 'This guide covers behavioral questions, technical assessments, and cultural fit evaluation...' },
      { id: 'kb-2', name: 'Company Culture & Values', description: 'Overview of our company culture and core values', type: 'pdf', size: '1.2 MB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-05'), content: 'Our core values include integrity, innovation, and customer focus...' },
      { id: 'kb-3', name: 'Technical Interview Questions - Engineering', description: 'Standard technical questions for software engineering roles', type: 'doc', size: '856 KB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-10'), content: 'System design questions, coding challenges, and algorithm problems...' },
      { id: 'kb-4', name: 'HR Policies Manual', description: 'Employee handbook and HR policies', type: 'pdf', size: '3.8 MB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-11-15'), content: 'This manual contains policies on PTO, benefits, conduct, and more...' },
      { id: 'kb-5', name: 'Guía de Entrevistas', description: 'Spanish version of interview guide', type: 'pdf', size: '2.1 MB', status: 'processed', languageCode: 'es', languageFlag: '🇪🇸', createdAt: new Date('2024-12-08'), content: 'Esta guía cubre preguntas de comportamiento, evaluaciones técnicas...' },
      { id: 'kb-6', name: 'Salary Bands & Compensation', description: 'Compensation structure and salary ranges', type: 'doc', size: '512 KB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-11-20'), content: 'Salary bands for each level: Junior, Mid, Senior, Staff, Principal...' },
      { id: 'kb-7', name: 'Benefits Overview', type: 'url', size: '-', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-12'), description: 'Link to benefits portal', content: 'https://benefits.company.com - Health, dental, vision, 401k...' },
      { id: 'kb-8', name: 'Onboarding Checklist', description: 'New hire onboarding process', type: 'txt', size: '45 KB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-14'), content: '1. Complete paperwork\n2. Set up accounts\n3. Meet the team...' },
    ];

    // Filter by language if specified
    const filteredDocuments = currentLanguage
      ? sampleDocuments.filter(d => d.languageCode === currentLanguage)
      : sampleDocuments;

    // Calculate stats
    const totalSizeBytes = filteredDocuments.reduce((sum, d) => {
      const match = d.size.match(/([\d.]+)\s*(KB|MB|GB)?/);
      if (!match) return sum;
      const value = parseFloat(match[1]);
      const unit = match[2] || 'KB';
      const multiplier = unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : 1024;
      return sum + (value * multiplier);
    }, 0);

    const formatSize = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return (bytes / 1024).toFixed(1) + ' KB';
    };

    const uniqueLanguages = [...new Set(sampleDocuments.map(d => d.languageCode))];

    res.render('admin/knowledge-base', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      documents: filteredDocuments,
      totalSize: formatSize(totalSizeBytes),
      languageCount: uniqueLanguages.length,
      languages,
      currentLanguage,
    });
  } catch (err) {
    logger.error({ err }, 'Knowledge Base error');
    res.render('admin/error', { error: 'Failed to load knowledge base', token: res.locals.token, basePath });
  }
});

// Get single document
router.get('/knowledge-base/:id', async (req, res) => {
  try {
    // Sample document lookup (in production, fetch from DB)
    const sampleDocuments: Record<string, object> = {
      'kb-1': { id: 'kb-1', name: 'Interview Best Practices Guide', description: 'Complete guide for conducting effective interviews', type: 'pdf', size: '2.4 MB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-01'), content: 'This comprehensive guide covers:\n\n1. Behavioral Questions\n- Tell me about a time when...\n- Describe a situation where...\n\n2. Technical Assessments\n- Coding challenges\n- System design\n- Algorithm problems\n\n3. Cultural Fit\n- Values alignment\n- Team collaboration\n- Growth mindset' },
      'kb-2': { id: 'kb-2', name: 'Company Culture & Values', description: 'Overview of our company culture and core values', type: 'pdf', size: '1.2 MB', status: 'processed', languageCode: 'en', languageFlag: '🇺🇸', createdAt: new Date('2024-12-05'), content: 'Our Core Values:\n\n1. INTEGRITY\nWe do the right thing, even when no one is watching.\n\n2. INNOVATION\nWe challenge the status quo and embrace change.\n\n3. CUSTOMER FOCUS\nOur customers success is our success.\n\n4. TEAMWORK\nWe achieve more together than alone.' },
    };

    const doc = sampleDocuments[req.params.id];
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document: doc });
  } catch (err) {
    logger.error({ err }, 'Get KB document error');
    res.status(500).json({ success: false, error: 'Failed to get document' });
  }
});

// Upload documents (placeholder - would need actual file handling)
router.post('/knowledge-base/upload', upload.array('files', 10), async (req, res) => {
  try {
    // In production: process uploaded files, extract text, store in DB
    res.json({ success: true, message: 'Files uploaded successfully' });
  } catch (err) {
    logger.error({ err }, 'KB upload error');
    res.status(500).json({ success: false, error: 'Failed to upload files' });
  }
});

// Add URL
router.post('/knowledge-base/url', async (req, res) => {
  try {
    const { url, name, language, description } = req.body;
    // In production: fetch URL content, extract text, store in DB
    res.json({ success: true, message: 'URL added successfully' });
  } catch (err) {
    logger.error({ err }, 'KB add URL error');
    res.status(500).json({ success: false, error: 'Failed to add URL' });
  }
});

// Delete document
router.delete('/knowledge-base/:id', async (req, res) => {
  try {
    // In production: delete from DB and storage
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'KB delete error');
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

// Reprocess document
router.post('/knowledge-base/:id/reprocess', async (req, res) => {
  try {
    // In production: queue document for reprocessing
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'KB reprocess error');
    res.status(500).json({ success: false, error: 'Failed to reprocess document' });
  }
});

// Bulk delete
router.post('/knowledge-base/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    // In production: delete multiple documents
    res.json({ success: true, deleted: ids?.length || 0 });
  } catch (err) {
    logger.error({ err }, 'KB bulk delete error');
    res.status(500).json({ success: false, error: 'Failed to delete documents' });
  }
});

// Bulk reprocess
router.post('/knowledge-base/bulk-reprocess', async (req, res) => {
  try {
    const { ids } = req.body;
    // In production: queue multiple documents for reprocessing
    res.json({ success: true, queued: ids?.length || 0 });
  } catch (err) {
    logger.error({ err }, 'KB bulk reprocess error');
    res.status(500).json({ success: false, error: 'Failed to reprocess documents' });
  }
});

// Logic Rules
router.get('/logic-rules', async (req, res) => {
  try {
    const branding = await getBranding();
    const rules = await prisma.logicRule.findMany({
      orderBy: { priority: 'desc' },
    });
    res.render('admin/logic-rules', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      rules,
    });
  } catch (err) {
    logger.error({ err }, 'Logic Rules error');
    res.render('admin/error', { error: 'Failed to load logic rules', token: res.locals.token, basePath });
  }
});

// Functions
router.get('/functions', async (req, res) => {
  try {
    const branding = await getBranding();
    const functions = await prisma.function.findMany({
      orderBy: { name: 'asc' },
    });
    res.render('admin/functions', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      functions,
    });
  } catch (err) {
    logger.error({ err }, 'Functions error');
    res.render('admin/error', { error: 'Failed to load functions', token: res.locals.token, basePath });
  }
});

// SMS Settings
router.get('/sms-settings', async (req, res) => {
  try {
    const branding = await getBranding();
    const settings = await prisma.sMSSettings.findFirst();
    res.render('admin/sms-settings', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      settings,
    });
  } catch (err) {
    logger.error({ err }, 'SMS Settings error');
    res.render('admin/error', { error: 'Failed to load SMS settings', token: res.locals.token, basePath });
  }
});

// Webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const branding = await getBranding();
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.render('admin/webhooks', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      webhooks,
    });
  } catch (err) {
    logger.error({ err }, 'Webhooks error');
    res.render('admin/error', { error: 'Failed to load webhooks', token: res.locals.token, basePath });
  }
});

// Payment Gateways
router.get('/payment-gateways', async (req, res) => {
  try {
    const branding = await getBranding();
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.render('admin/payment-gateways', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      gateways,
    });
  } catch (err) {
    logger.error({ err }, 'Payment gateways error');
    res.render('admin/error', { error: 'Failed to load payment gateways', token: res.locals.token, basePath });
  }
});

// Update Payment Gateway
router.post('/payment-gateways/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const data = req.body;

    await prisma.paymentGateway.upsert({
      where: { provider },
      update: {
        isEnabled: data.isEnabled === true || data.isEnabled === 'true',
        testMode: data.testMode === true || data.testMode === 'true',
        publishableKey: data.publishableKey || null,
        secretKey: data.secretKey || null,
        webhookSecret: data.webhookSecret || null,
        clientId: data.clientId || null,
        clientSecret: data.clientSecret || null,
        webhookId: data.webhookId || null,
        merchantId: data.merchantId || null,
        publicKey: data.publicKey || null,
        privateKey: data.privateKey || null,
        applicationId: data.applicationId || null,
        accessToken: data.accessToken || null,
        locationId: data.locationId || null,
        webhookSignatureKey: data.webhookSignatureKey || null,
        apiLoginId: data.apiLoginId || null,
        transactionKey: data.transactionKey || null,
        signatureKey: data.signatureKey || null
      },
      create: {
        provider,
        isEnabled: data.isEnabled === true || data.isEnabled === 'true',
        testMode: data.testMode === true || data.testMode === 'true',
        publishableKey: data.publishableKey || null,
        secretKey: data.secretKey || null,
        webhookSecret: data.webhookSecret || null,
        clientId: data.clientId || null,
        clientSecret: data.clientSecret || null,
        webhookId: data.webhookId || null,
        merchantId: data.merchantId || null,
        publicKey: data.publicKey || null,
        privateKey: data.privateKey || null,
        applicationId: data.applicationId || null,
        accessToken: data.accessToken || null,
        locationId: data.locationId || null,
        webhookSignatureKey: data.webhookSignatureKey || null,
        apiLoginId: data.apiLoginId || null,
        transactionKey: data.transactionKey || null,
        signatureKey: data.signatureKey || null
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Update payment gateway error');
    res.status(500).json({ error: 'Failed to update payment gateway' });
  }
});

// Test Payment Gateway Connection
router.post('/payment-gateways/test/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const gateway = await prisma.paymentGateway.findUnique({ where: { provider } });

    if (!gateway) {
      return res.json({ success: false, message: 'Gateway not configured' });
    }

    if (!gateway.isEnabled) {
      return res.json({ success: false, message: 'Gateway is not enabled' });
    }

    let isConfigured = false;
    switch (provider) {
      case 'stripe':
        isConfigured = !!(gateway.publishableKey && gateway.secretKey);
        break;
      case 'paypal':
        isConfigured = !!(gateway.clientId && gateway.clientSecret);
        break;
      case 'braintree':
        isConfigured = !!(gateway.merchantId && gateway.publicKey && gateway.privateKey);
        break;
      case 'square':
        isConfigured = !!(gateway.applicationId && gateway.accessToken && gateway.locationId);
        break;
      case 'authorize':
        isConfigured = !!(gateway.apiLoginId && gateway.transactionKey);
        break;
    }

    if (isConfigured) {
      res.json({ success: true, message: `${provider} configuration valid`, testMode: gateway.testMode });
    } else {
      res.json({ success: false, message: `${provider} is missing required credentials` });
    }
  } catch (err) {
    logger.error({ err }, 'Test gateway error');
    res.status(500).json({ success: false, message: 'Connection test failed' });
  }
});

// Transactions
router.get('/transactions', async (req, res) => {
  try {
    const branding = await getBranding();
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    res.render('admin/transactions', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      payments,
      totalRevenue,
    });
  } catch (err) {
    logger.error({ err }, 'Transactions error');
    res.render('admin/error', { error: 'Failed to load transactions', token: res.locals.token, basePath });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const {
      defaultVoice,
      defaultDuration,
      maxInterviewMins,
      aiIntroduction,
      transcriptionEnabled,
      recordingEnabled,
      autoSummaryEnabled,
      autoScoreEnabled,
      sentimentAnalysis,
      emailNotifications,
      reminderHours,
    } = req.body;

    // Check if config exists
    const existing = await prisma.appConfig.findFirst();

    if (existing) {
      await prisma.appConfig.update({
        where: { id: existing.id },
        data: {
          selectedVoice: defaultVoice || 'alloy',
          maxInterviewMins: parseInt(maxInterviewMins) || 120,
          transcriptionEnabled: transcriptionEnabled === true || transcriptionEnabled === 'true',
          autoSummaryEnabled: autoSummaryEnabled === true || autoSummaryEnabled === 'true',
        },
      });
    } else {
      await prisma.appConfig.create({
        data: {
          appName: 'AI Recruiting Assistant',
          selectedVoice: defaultVoice || 'alloy',
          maxInterviewMins: parseInt(maxInterviewMins) || 120,
          transcriptionEnabled: transcriptionEnabled === true || transcriptionEnabled === 'true',
          autoSummaryEnabled: autoSummaryEnabled === true || autoSummaryEnabled === 'true',
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Settings save error');
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// ============================================
// Features
// ============================================

router.get('/features', async (req, res) => {
  try {
    const branding = await getBranding();
    const features = await prisma.features.findFirst();

    res.render('admin/features', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      features,
    });
  } catch (err) {
    logger.error({ err }, 'Features error');
    res.render('admin/error', { error: 'Failed to load features', token: res.locals.token, basePath });
  }
});

router.post('/features', async (req, res) => {
  try {
    const featuresData = req.body;

    const existing = await prisma.features.findFirst();
    if (existing) {
      await prisma.features.update({
        where: { id: existing.id },
        data: featuresData,
      });
    } else {
      await prisma.features.create({
        data: featuresData,
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Features save error');
    res.status(500).json({ success: false, error: 'Failed to save features' });
  }
});

// ============================================
// Account Settings
// ============================================

// Account page
router.get('/account', async (req: AdminRequest, res: Response) => {
  try {
    const viewData = await getViewData(req, res, 'account');

    // Get user data if it's a real user (not admin token)
    let user = null;
    if (req.userId && req.userId !== 'system') {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, email: true, phone: true }
      });
    }

    res.render('admin/account', {
      ...viewData,
      user,
    });
  } catch (err) {
    logger.error({ err }, 'Account page error');
    const viewData = await getViewData(req, res);
    res.render('admin/error', { ...viewData, error: 'Failed to load account settings' });
  }
});

// Account API - Get all account data
router.get('/api/account', async (req: AdminRequest, res: Response) => {
  try {
    if (!req.userId || req.userId === 'system') {
      // For admin token, return basic info
      return res.json({
        success: true,
        profile: { name: req.userName, email: req.userEmail, phone: null },
        paymentMethods: [],
        notificationPrefs: null,
        devices: []
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        paymentMethods: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
        notificationPrefs: true,
        devices: { orderBy: { lastSeenAt: 'desc' } }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    const devices = (user.devices || []).map(d => ({
      ...d,
      isCurrent: d.ipAddress === clientIp
    }));

    res.json({
      success: true,
      profile: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      paymentMethods: user.paymentMethods || [],
      notificationPrefs: user.notificationPrefs,
      devices
    });
  } catch (err) {
    logger.error({ err }, 'Account API error');
    res.status(500).json({ success: false, error: 'Failed to load account data' });
  }
});

// Update name
router.put('/api/account/name', async (req: AdminRequest, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
  }

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update system user' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true }
    });

    res.json({ success: true, user });
  } catch (err) {
    logger.error({ err }, 'Update name error');
    res.status(500).json({ success: false, error: 'Failed to update name' });
  }
});

// Update email
router.put('/api/account/email', async (req: AdminRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required to change email' });
  }

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update system user' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Check if email is already in use within the same company
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), companyId: user.companyId }
    });
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({ success: false, error: 'Email is already in use' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true }
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    logger.error({ err }, 'Update email error');
    res.status(500).json({ success: false, error: 'Failed to update email' });
  }
});

// Update phone
router.put('/api/account/phone', async (req: AdminRequest, res: Response) => {
  const { phone } = req.body;

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update system user' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { phone: phone || null },
      select: { id: true, name: true, email: true, phone: true }
    });

    res.json({ success: true, user });
  } catch (err) {
    logger.error({ err }, 'Update phone error');
    res.status(500).json({ success: false, error: 'Failed to update phone' });
  }
});

// Change password
router.put('/api/account/password', async (req: AdminRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  }

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update system user' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    logger.error({ err }, 'Change password error');
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Get payment methods
router.get('/api/account/payment-methods', async (req: AdminRequest, res: Response) => {
  if (!req.userId || req.userId === 'system') {
    return res.json({ success: true, paymentMethods: [] });
  }

  try {
    const paymentMethods = await prisma.userPaymentMethod.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, paymentMethods });
  } catch (err) {
    logger.error({ err }, 'Get payment methods error');
    res.status(500).json({ success: false, error: 'Failed to get payment methods' });
  }
});

// Add payment method
router.post('/api/account/payment-methods', async (req: AdminRequest, res: Response) => {
  const { cardType, cardLast4, cardHolderName, expiryMonth, expiryYear, isDefault, gateway, gatewayCustomerId, gatewayPaymentMethodId } = req.body;

  if (!cardType || !cardLast4 || !cardHolderName || !expiryMonth || !expiryYear) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot add payment method for system user' });
  }

  try {
    if (isDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false }
      });
    }

    const existingCount = await prisma.userPaymentMethod.count({
      where: { userId: req.userId }
    });

    const paymentMethod = await prisma.userPaymentMethod.create({
      data: {
        userId: req.userId,
        cardType,
        cardLast4,
        cardHolderName,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        isDefault: isDefault || existingCount === 0,
        gateway,
        gatewayCustomerId,
        gatewayPaymentMethodId
      }
    });

    res.status(201).json({ success: true, paymentMethod });
  } catch (err) {
    logger.error({ err }, 'Add payment method error');
    res.status(500).json({ success: false, error: 'Failed to add payment method' });
  }
});

// Set default payment method
router.put('/api/account/payment-methods/:id/default', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update payment method for system user' });
  }

  try {
    const paymentMethod = await prisma.userPaymentMethod.findFirst({
      where: { id, userId: req.userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, error: 'Payment method not found' });
    }

    await prisma.userPaymentMethod.updateMany({
      where: { userId: req.userId },
      data: { isDefault: false }
    });

    const updated = await prisma.userPaymentMethod.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({ success: true, paymentMethod: updated });
  } catch (err) {
    logger.error({ err }, 'Set default payment method error');
    res.status(500).json({ success: false, error: 'Failed to set default payment method' });
  }
});

// Delete payment method
router.delete('/api/account/payment-methods/:id', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot delete payment method for system user' });
  }

  try {
    const paymentMethod = await prisma.userPaymentMethod.findFirst({
      where: { id, userId: req.userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, error: 'Payment method not found' });
    }

    await prisma.userPaymentMethod.delete({ where: { id } });

    // If deleted was default, make the newest one default
    if (paymentMethod.isDefault) {
      const newest = await prisma.userPaymentMethod.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      if (newest) {
        await prisma.userPaymentMethod.update({
          where: { id: newest.id },
          data: { isDefault: true }
        });
      }
    }

    res.json({ success: true, message: 'Payment method removed' });
  } catch (err) {
    logger.error({ err }, 'Delete payment method error');
    res.status(500).json({ success: false, error: 'Failed to remove payment method' });
  }
});

// Get notification preferences
router.get('/api/account/notifications', async (req: AdminRequest, res: Response) => {
  if (!req.userId || req.userId === 'system') {
    return res.json({ success: true, preferences: null });
  }

  try {
    let prefs = await prisma.userNotificationPreference.findUnique({
      where: { userId: req.userId }
    });

    if (!prefs) {
      prefs = await prisma.userNotificationPreference.create({
        data: { userId: req.userId }
      });
    }

    res.json({ success: true, preferences: prefs });
  } catch (err) {
    logger.error({ err }, 'Get notifications error');
    res.status(500).json({ success: false, error: 'Failed to get notification preferences' });
  }
});

// Update notification preferences
router.put('/api/account/notifications', async (req: AdminRequest, res: Response) => {
  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot update notifications for system user' });
  }

  try {
    const validKeys = [
      'interviewScheduledEmail', 'interviewScheduledSms', 'interviewScheduledPush',
      'interviewReminderEmail', 'interviewReminderSms', 'interviewReminderPush',
      'interviewCompletedEmail', 'interviewCompletedSms', 'interviewCompletedPush',
      'newCandidateEmail', 'newCandidateSms', 'newCandidatePush',
      'candidateResultsEmail', 'candidateResultsSms', 'candidateResultsPush',
      'subscriptionEmail', 'subscriptionSms', 'subscriptionPush',
      'paymentEmail', 'paymentSms', 'paymentPush',
      'securityEmail', 'securitySms', 'securityPush'
    ];

    const updates: Record<string, boolean> = {};
    for (const key of validKeys) {
      if (typeof req.body[key] === 'boolean') {
        updates[key] = req.body[key];
      }
    }

    const prefs = await prisma.userNotificationPreference.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...updates },
      update: updates
    });

    res.json({ success: true, preferences: prefs });
  } catch (err) {
    logger.error({ err }, 'Update notifications error');
    res.status(500).json({ success: false, error: 'Failed to update notification preferences' });
  }
});

// Get devices
router.get('/api/account/devices', async (req: AdminRequest, res: Response) => {
  if (!req.userId || req.userId === 'system') {
    return res.json({ success: true, devices: [] });
  }

  try {
    const devices = await prisma.userDevice.findMany({
      where: { userId: req.userId },
      orderBy: { lastSeenAt: 'desc' }
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    const devicesWithCurrent = devices.map(d => ({
      ...d,
      isCurrent: d.ipAddress === clientIp
    }));

    res.json({ success: true, devices: devicesWithCurrent });
  } catch (err) {
    logger.error({ err }, 'Get devices error');
    res.status(500).json({ success: false, error: 'Failed to get devices' });
  }
});

// Sign out device
router.delete('/api/account/devices/:id', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;

  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot sign out device for system user' });
  }

  try {
    const device = await prisma.userDevice.findFirst({
      where: { id, userId: req.userId }
    });

    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    await prisma.userDevice.delete({ where: { id } });
    res.json({ success: true, message: 'Device signed out' });
  } catch (err) {
    logger.error({ err }, 'Delete device error');
    res.status(500).json({ success: false, error: 'Failed to sign out device' });
  }
});

// Sign out all devices except current
router.delete('/api/account/devices', async (req: AdminRequest, res: Response) => {
  if (!req.userId || req.userId === 'system') {
    return res.status(403).json({ success: false, error: 'Cannot sign out devices for system user' });
  }

  try {
    const clientIp = req.ip || req.socket.remoteAddress;

    await prisma.userDevice.deleteMany({
      where: {
        userId: req.userId,
        NOT: { ipAddress: clientIp as string }
      }
    });

    res.json({ success: true, message: 'Signed out of all other devices' });
  } catch (err) {
    logger.error({ err }, 'Delete all devices error');
    res.status(500).json({ success: false, error: 'Failed to sign out devices' });
  }
});

// ============================================
// Trial Codes
// ============================================

router.get('/trial-codes', async (req: AdminRequest, res: Response) => {
  try {
    const viewData = await getViewData(req, res, 'trial-codes');
    res.render('admin/trial-codes', viewData);
  } catch (err) {
    logger.error({ err }, 'Trial codes page error');
    res.render('admin/error', { error: 'Failed to load trial codes', token: res.locals.token, basePath });
  }
});

router.get('/api/trial-codes', async (req: AdminRequest, res: Response) => {
  try {
    const codes = await prisma.trialCode.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: codes.length,
      pending: codes.filter((c: any) => c.status === 'PENDING').length,
      redeemed: codes.filter((c: any) => c.status === 'REDEEMED').length,
      expired: codes.filter((c: any) => c.status === 'EXPIRED').length
    };

    res.json({ success: true, codes, stats });
  } catch (err) {
    logger.error({ err }, 'Get trial codes error');
    res.status(500).json({ success: false, error: 'Failed to get trial codes' });
  }
});

router.post('/api/trial-codes', async (req: AdminRequest, res: Response) => {
  try {
    const { email, phone, trialDays = 14, expiresDays = 30 } = req.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const trialCode = await prisma.trialCode.create({
      data: {
        code,
        email: email || null,
        phone: phone || null,
        trialDays,
        expiresAt,
        status: 'PENDING'
      }
    });

    res.json({ success: true, code: trialCode });
  } catch (err) {
    logger.error({ err }, 'Create trial code error');
    res.status(500).json({ success: false, error: 'Failed to create trial code' });
  }
});

router.post('/api/trial-codes/:id/extend', async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.body;

    const trialCode = await prisma.trialCode.findUnique({ where: { id } });
    if (!trialCode) {
      return res.status(404).json({ success: false, error: 'Trial code not found' });
    }

    const newExpiry = new Date(trialCode.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + days);

    await prisma.trialCode.update({
      where: { id },
      data: { expiresAt: newExpiry }
    });

    res.json({ success: true, message: 'Trial code extended' });
  } catch (err) {
    logger.error({ err }, 'Extend trial code error');
    res.status(500).json({ success: false, error: 'Failed to extend trial code' });
  }
});

router.post('/api/trial-codes/:id/revoke', async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.trialCode.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() }
    });

    res.json({ success: true, message: 'Trial code revoked' });
  } catch (err) {
    logger.error({ err }, 'Revoke trial code error');
    res.status(500).json({ success: false, error: 'Failed to revoke trial code' });
  }
});

// ============================================
// My Subscription
// ============================================

router.get('/my-subscription', async (req: AdminRequest, res: Response) => {
  try {
    const viewData = await getViewData(req, res, 'my-subscription');
    res.render('admin/my-subscription', viewData);
  } catch (err) {
    logger.error({ err }, 'My subscription page error');
    res.render('admin/error', { error: 'Failed to load subscription', token: res.locals.token, basePath });
  }
});

router.get('/api/my-subscription', async (req: AdminRequest, res: Response) => {
  try {
    if (!req.userId || req.userId === 'system') {
      return res.json({ success: true, subscription: null });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId },
      include: { plan: true }
    });

    res.json({ success: true, subscription });
  } catch (err) {
    logger.error({ err }, 'Get subscription error');
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
});

router.post('/api/subscription/cancel', async (req: AdminRequest, res: Response) => {
  try {
    if (!req.userId || req.userId === 'system') {
      return res.status(403).json({ success: false, error: 'Cannot cancel subscription' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: 'active' }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'canceled', canceledAt: new Date() }
      });
    }

    res.json({ success: true, message: 'Subscription canceled' });
  } catch (err) {
    logger.error({ err }, 'Cancel subscription error');
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

router.post('/api/subscription/resume', async (req: AdminRequest, res: Response) => {
  try {
    if (!req.userId || req.userId === 'system') {
      return res.status(403).json({ success: false, error: 'Cannot resume subscription' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: 'canceled' }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active', canceledAt: null }
      });
    }

    res.json({ success: true, message: 'Subscription resumed' });
  } catch (err) {
    logger.error({ err }, 'Resume subscription error');
    res.status(500).json({ success: false, error: 'Failed to resume subscription' });
  }
});

// ============================================
// Pricing Plans
// ============================================

router.get('/pricing', async (req: AdminRequest, res: Response) => {
  try {
    const viewData = await getViewData(req, res, 'pricing');
    res.render('admin/pricing', viewData);
  } catch (err) {
    logger.error({ err }, 'Pricing page error');
    res.render('admin/error', { error: 'Failed to load pricing', token: res.locals.token, basePath });
  }
});

router.get('/api/pricing', async (req: AdminRequest, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    let currentPlanId = null;
    if (req.userId && req.userId !== 'system') {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      if (subscription) {
        currentPlanId = subscription.planId;
      }
    }

    res.json({ success: true, plans, currentPlanId });
  } catch (err) {
    logger.error({ err }, 'Get pricing error');
    res.status(500).json({ success: false, error: 'Failed to get pricing' });
  }
});

router.post('/api/subscription/subscribe/:planId', async (req: AdminRequest, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // For demo, return a mock checkout URL
    res.json({ success: true, checkout_url: `https://checkout.stripe.com/pay/${planId}` });
  } catch (err) {
    logger.error({ err }, 'Subscribe error');
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

router.post('/api/subscription/start-trial/:planId', async (req: AdminRequest, res: Response) => {
  try {
    const { planId } = req.params;

    if (!req.userId || req.userId === 'system') {
      return res.status(403).json({ success: false, error: 'Cannot start trial' });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.subscription.create({
      data: {
        userId: req.userId,
        planId,
        status: 'trialing',
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Start trial error');
    res.status(500).json({ success: false, error: 'Failed to start trial' });
  }
});

export default router;

// ============================================
// Microsoft Teams Integration
// ============================================

router.get('/teams', async (req, res) => {
  try {
    const company = await prisma.company.findFirst();
    const companyId = company?.id;
    const branding = await getBranding();

    // Check if Teams is configured
    const teamsConfig = {
      connected: !!(process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
      tenantId: process.env.MICROSOFT_TENANT_ID ? '****' + process.env.MICROSOFT_TENANT_ID.slice(-4) : '',
      clientId: process.env.MICROSOFT_CLIENT_ID ? '****' + process.env.MICROSOFT_CLIENT_ID.slice(-4) : '',
    };

    // Get scheduled interviews that could be linked to Teams
    const interviews = companyId
      ? await prisma.interview.findMany({
          where: {
            companyId,
            status: 'SCHEDULED',
            scheduledAt: { gte: new Date() },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 50,
          include: {
            jobRole: { select: { title: true } },
          },
        })
      : [];

    // For now, meetings and subscriptions are empty until we implement Teams meeting storage
    const meetings: Array<{
      id: string;
      subject: string;
      candidateName: string;
      candidateEmail: string;
      startDateTime: string;
      duration: number;
      status: string;
      joinUrl: string;
    }> = [];
    const subscriptions: Array<{
      id: string;
      resource: string;
      changeType: string;
      expirationDateTime: string;
    }> = [];

    const stats = {
      scheduledMeetings: meetings.length,
      activeSubscriptions: subscriptions.length,
    };

    res.render('admin/teams', {
      token: res.locals.token,
      basePath,
      branding,
      userRole: (req as AdminRequest).userRole,
      teamsConfig,
      meetings,
      subscriptions,
      interviews,
      stats,
    });
  } catch (err) {
    logger.error({ err }, 'Teams page error');
    res.render('admin/error', { error: 'Failed to load Teams integration', token: res.locals.token, basePath });
  }
});

router.get('/teams/test-connection', async (req, res) => {
  try {
    const tenantId = process.env.MICROSOFT_TENANT_ID;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      return res.json({
        success: false,
        error: 'Microsoft Graph API credentials not configured',
      });
    }

    // Try to get a token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (response.ok) {
      res.json({ success: true, message: 'Connection successful' });
    } else {
      const error = await response.json();
      res.json({
        success: false,
        error: error.error_description || 'Authentication failed',
      });
    }
  } catch (err) {
    logger.error({ err }, 'Teams connection test error');
    res.json({ success: false, error: 'Connection test failed' });
  }
});
