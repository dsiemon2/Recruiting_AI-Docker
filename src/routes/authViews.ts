import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Base path for Docker deployment
const basePath = '/RecruitingAI';

/**
 * Helper to get branding and store info for auth pages
 */
async function getBrandingData() {
  try {
    const [branding, storeInfo] = await Promise.all([
      prisma.branding.findFirst(),
      prisma.storeInfo.findFirst(),
    ]);
    return { branding: branding || {}, storeInfo: storeInfo || {} };
  } catch {
    return { branding: {}, storeInfo: {} };
  }
}

/**
 * GET /auth/login
 * Redirect to main chat interface
 */
router.get('/login', async (_req: Request, res: Response) => {
  res.redirect(`${basePath}/`);
});

/**
 * GET /auth/register
 * Registration page
 */
router.get('/register', async (_req: Request, res: Response) => {
  const { branding, storeInfo } = await getBrandingData();

  // Industry options for registration
  const industries = [
    'Technology',
    'Healthcare',
    'Finance & Banking',
    'Retail & E-commerce',
    'Manufacturing',
    'Education',
    'Government',
    'Non-Profit',
    'Professional Services',
    'Media & Entertainment',
    'Real Estate',
    'Transportation & Logistics',
    'Energy & Utilities',
    'Hospitality & Tourism',
    'Other',
  ];

  // Company size options
  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ];

  res.render('auth/register', {
    branding,
    storeInfo,
    industries,
    companySizes,
  });
});

/**
 * GET /auth/forgot-password
 * Forgot password page
 */
router.get('/forgot-password', async (_req: Request, res: Response) => {
  const { branding, storeInfo } = await getBrandingData();
  res.render('auth/forgot-password', { branding, storeInfo });
});

/**
 * GET /auth/reset-password
 * Reset password page (expects ?token=xxx)
 */
router.get('/reset-password', async (_req: Request, res: Response) => {
  const { branding, storeInfo } = await getBrandingData();
  res.render('auth/reset-password', { branding, storeInfo });
});

/**
 * GET /auth/verify-email
 * Email verification result page
 */
router.get('/verify-email', async (_req: Request, res: Response) => {
  const { branding, storeInfo } = await getBrandingData();
  res.render('auth/verify-email', { branding, storeInfo });
});

export default router;
