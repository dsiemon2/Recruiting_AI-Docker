import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types/index.js';

/**
 * Role hierarchy (most to least privileged):
 * 1. SUPER_ADMIN - Platform-wide, manages all companies
 * 2. COMPANY_ADMIN - Company-level full control
 * 3. MANAGER - Interview management, view most data
 * 4. SUPERVISOR - View sessions/analytics, limited access
 * 5. CANDIDATE - Own interviews only
 */

/**
 * Permission definitions based on RBAC requirements
 *
 * Menu Access by Role:
 * - Dashboard: All roles
 * - Sessions/Interviews: All roles (filtered by role)
 * - Analytics: All roles (filtered by role)
 * - Interview Setup (Job Roles, Questions): SUPER_ADMIN only
 * - AI Configuration: SUPER_ADMIN only
 * - Automation: SUPER_ADMIN only
 * - Communication: SUPER_ADMIN only (Call Transfer also COMPANY_ADMIN)
 * - Integrations: SUPER_ADMIN only
 * - Company Management: SUPER_ADMIN, COMPANY_ADMIN (Companies = SUPER_ADMIN only)
 * - Billing: SUPER_ADMIN only
 * - System Settings: SUPER_ADMIN only
 * - Help & Support: All roles
 */
const permissions: Record<string, Role[]> = {
  // ============================================
  // COMPANY MANAGEMENT (Super Admin only)
  // ============================================
  'company:create': ['SUPER_ADMIN'],
  'company:read_all': ['SUPER_ADMIN'],
  'company:read': ['SUPER_ADMIN'],
  'company:update': ['SUPER_ADMIN'],
  'company:delete': ['SUPER_ADMIN'],

  // ============================================
  // USER MANAGEMENT (Super Admin & Company Admin)
  // ============================================
  'user:create': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  'user:read': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  'user:read_all': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  'user:update': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  'user:delete': ['SUPER_ADMIN', 'COMPANY_ADMIN'],

  // ============================================
  // JOB ROLE MANAGEMENT (Super Admin only)
  // ============================================
  'job_role:create': ['SUPER_ADMIN'],
  'job_role:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR'],
  'job_role:update': ['SUPER_ADMIN'],
  'job_role:delete': ['SUPER_ADMIN'],

  // ============================================
  // QUESTION MANAGEMENT (Super Admin only)
  // ============================================
  'question:create': ['SUPER_ADMIN'],
  'question:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR'],
  'question:update': ['SUPER_ADMIN'],
  'question:delete': ['SUPER_ADMIN'],
  'question:import': ['SUPER_ADMIN'],

  // ============================================
  // INTERVIEW/SESSION MANAGEMENT (All roles, filtered)
  // ============================================
  'interview:create': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'],
  'interview:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
  'interview:read_all': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'],
  'interview:read_own': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
  'interview:update': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'],
  'interview:delete': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  'interview:conduct': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],

  // ============================================
  // RESULTS (All roles can view, limited update)
  // ============================================
  'result:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
  'result:read_own': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
  'result:update': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'],

  // ============================================
  // ANALYTICS (All roles, filtered by scope)
  // ============================================
  'analytics:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
  'analytics:read_all': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'],
  'analytics:read_own': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],

  // ============================================
  // DASHBOARD (All roles)
  // ============================================
  'dashboard:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],

  // ============================================
  // AI CONFIGURATION (Super Admin only)
  // ============================================
  'ai_config:read': ['SUPER_ADMIN'],
  'ai_config:update': ['SUPER_ADMIN'],
  'ai_agents:read': ['SUPER_ADMIN'],
  'ai_agents:create': ['SUPER_ADMIN'],
  'ai_agents:update': ['SUPER_ADMIN'],
  'ai_agents:delete': ['SUPER_ADMIN'],
  'ai_tools:read': ['SUPER_ADMIN'],
  'ai_tools:create': ['SUPER_ADMIN'],
  'ai_tools:update': ['SUPER_ADMIN'],
  'ai_tools:delete': ['SUPER_ADMIN'],
  'knowledge_base:read': ['SUPER_ADMIN'],
  'knowledge_base:update': ['SUPER_ADMIN'],
  'voices:read': ['SUPER_ADMIN'],
  'voices:update': ['SUPER_ADMIN'],
  'greeting:read': ['SUPER_ADMIN'],
  'greeting:update': ['SUPER_ADMIN'],

  // ============================================
  // AUTOMATION (Super Admin only)
  // ============================================
  'logic_rules:read': ['SUPER_ADMIN'],
  'logic_rules:create': ['SUPER_ADMIN'],
  'logic_rules:update': ['SUPER_ADMIN'],
  'logic_rules:delete': ['SUPER_ADMIN'],
  'functions:read': ['SUPER_ADMIN'],
  'functions:create': ['SUPER_ADMIN'],
  'functions:update': ['SUPER_ADMIN'],
  'functions:delete': ['SUPER_ADMIN'],

  // ============================================
  // COMMUNICATION (Super Admin, some Company Admin)
  // ============================================
  'sms_settings:read': ['SUPER_ADMIN'],
  'sms_settings:update': ['SUPER_ADMIN'],
  'webhooks:read': ['SUPER_ADMIN'],
  'webhooks:create': ['SUPER_ADMIN'],
  'webhooks:update': ['SUPER_ADMIN'],
  'webhooks:delete': ['SUPER_ADMIN'],

  // ============================================
  // INTEGRATIONS (Super Admin only)
  // ============================================
  'ms_teams:read': ['SUPER_ADMIN'],
  'ms_teams:update': ['SUPER_ADMIN'],

  // ============================================
  // BILLING (Super Admin only)
  // ============================================
  'payments:read': ['SUPER_ADMIN'],
  'payments:create': ['SUPER_ADMIN'],
  'payments:update': ['SUPER_ADMIN'],

  // ============================================
  // SYSTEM SETTINGS (Super Admin only)
  // ============================================
  'settings:read': ['SUPER_ADMIN'],
  'settings:update': ['SUPER_ADMIN'],
  'features:read': ['SUPER_ADMIN'],
  'features:update': ['SUPER_ADMIN'],
  'account:read': ['SUPER_ADMIN'],
  'account:update': ['SUPER_ADMIN'],

  // ============================================
  // HELP & SUPPORT (All roles)
  // ============================================
  'help:read': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  const allowedRoles = permissions[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): string[] {
  return Object.entries(permissions)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Middleware factory to require specific permission
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Super admin always has access
    if (req.superAdmin) {
      next();
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!hasPermission(user.role, permission)) {
      res.status(403).json({
        success: false,
        error: `Permission denied: ${permission} requires one of: ${permissions[permission]?.join(', ') || 'none'}`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory to require one of multiple roles
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Super admin always has access
    if (req.superAdmin) {
      next();
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role as Role)) {
      res.status(403).json({
        success: false,
        error: `Access denied: requires one of: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require super admin only
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * Middleware to require company admin role
 */
export const requireCompanyAdmin = requireRole('SUPER_ADMIN', 'COMPANY_ADMIN');

/**
 * Middleware to require manager or above
 */
export const requireManager = requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER');

/**
 * Middleware to require supervisor or above
 */
export const requireSupervisor = requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR');

/**
 * Middleware to require any authenticated user (including candidates)
 */
export const requireAnyUser = requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'SUPERVISOR', 'CANDIDATE');

/**
 * Check if user can access specific interview (own or all based on role)
 */
export function canAccessInterview(userRole: Role, userId: string, interviewCandidateId?: string): boolean {
  // Super admin, company admin, and manager can see all
  if (['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'].includes(userRole)) {
    return true;
  }
  // Supervisor and candidate can only see their own
  // For candidates, we'd need to match by email or link
  return false;
}

/**
 * Export permissions for use in views
 */
export const PERMISSIONS = permissions;
