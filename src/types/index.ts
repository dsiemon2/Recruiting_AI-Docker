import { Request } from 'express';

// Role types - hierarchical from most to least privileged
// SUPER_ADMIN: Platform-wide access (manages all companies)
// COMPANY_ADMIN: Company-level full control
// MANAGER: Can manage interviews and view most data
// SUPERVISOR: Can view sessions/analytics, limited config access
// CANDIDATE: End-user who takes interviews (own data only)
export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'CANDIDATE';

// JWT Payload for regular users (excludes SUPER_ADMIN which uses separate token)
export type UserRole = 'COMPANY_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'CANDIDATE';

export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

// JWT Payload for super admin
export interface SuperAdminJwtPayload {
  superAdminId: string;
  email: string;
  role: 'SUPER_ADMIN';
}

// OAuth user data that might need company assignment
export interface OAuthPendingUser {
  profile: unknown;
  email: string;
  needsCompany: true;
}

// Full user from database
export interface AuthenticatedUser {
  id: string;
  email: string;
  companyId: string;
  role: string;
  company?: {
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  };
}

// Augment Express types to include our custom user type
declare global {
  namespace Express {
    // User matches JwtPayload for authenticated requests
    interface User extends JwtPayload {}
  }
}

// Interview modes
export type InterviewMode = 'AI_ONLY' | 'HYBRID';

// Interview status
export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// Recommendation types
export type Recommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO';

// Extended Express Request with auth info
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  superAdmin?: SuperAdminJwtPayload;
  companyId?: string;
}

// Question with parsed follow-ups
export interface QuestionWithFollowUps {
  id: string;
  text: string;
  followUps: string[];
  evaluationCriteria: string | null;
  timeAllocation: number;
  isRequired: boolean;
  order: number;
  categoryId: string;
}

// Scorecard structure
export interface Scorecard {
  categories: {
    [categoryName: string]: {
      score: number; // 1-5
      notes: string;
      questions: {
        questionId: string;
        questionText: string;
        response: string;
        score: number;
        notes: string;
      }[];
    };
  };
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
