# Recruiting AI - Project Reference

**Type:** AI-Powered Interview Platform
**Port:** 8085
**URL Prefix:** /RecruitingAI/
**Status:** Active (Development)
**Live URL:** https://www.recruitabilityai.com
**Last Updated:** 2026-01-19

---

## Role-Based Access Control (RBAC)

### User Roles (Hierarchical)
The system uses a 5-tier role hierarchy:

| Role | Level | Description |
|------|-------|-------------|
| SUPER_ADMIN | 5 | Full system access, manages all companies |
| COMPANY_ADMIN | 4 | Manages company settings, users, billing |
| MANAGER | 3 | Manages interviews, job roles, questions |
| SUPERVISOR | 2 | Views candidates, interviews, reports (read-only) |
| CANDIDATE | 1 | Views own interviews only |

### Demo Users
Quick login available via the login page:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@system.local | superadmin123 |
| Company Admin | admin@demo.local | admin123 |
| Manager | manager@demo.local | manager123 |
| Supervisor | supervisor@demo.local | supervisor123 |
| Candidate | candidate@demo.local | candidate123 |

### Menu Visibility by Role
- **Dashboard**: All roles
- **Analytics**: SUPERVISOR and above
- **Interviews**: All roles (CANDIDATE sees "My Interviews")
- **Interview Setup**: MANAGER and above
- **Candidates**: SUPERVISOR and above
- **AI Configuration**: SUPER_ADMIN only
- **Automation**: SUPER_ADMIN only
- **Communication**: SUPER_ADMIN only
- **Integrations**: COMPANY_ADMIN and above
- **User Management**: COMPANY_ADMIN and above
- **Company Management**: SUPER_ADMIN only
- **Billing**: COMPANY_ADMIN and above (Trial Codes, Payment Gateways, Transactions)
- **Account**: All roles (Account Settings, My Subscription, Pricing Plans)
- **System Settings**: SUPER_ADMIN only

### Testing Different Roles
Append `&role=ROLE_NAME` to admin URLs to test different role views:
- `?token=admin&role=MANAGER`
- `?token=admin&role=SUPERVISOR`
- `?token=admin&role=CANDIDATE`

## UI Component Standards

### Action Buttons
ALL action buttons must have Bootstrap tooltips:
```html
<button class="btn btn-sm btn-outline-primary"
        data-bs-toggle="tooltip"
        title="Describe what this button does">
  <i class="bi bi-icon-name"></i>
</button>
```

### Data Tables/Grids
ALL tables displaying data must include:

1. **Row Selection**
   - Checkbox column as first column
   - "Select All" checkbox in header
   - Individual row checkboxes
   - Selected row highlighting (`.selected` class)
   - Bulk actions toolbar that appears when rows selected

2. **Pagination**
   - Page size selector (10/25/50/100 per page)
   - Page number navigation
   - "Showing X-Y of Z items" info text
   - Previous/Next buttons

3. **Required CSS**
```css
.bulk-actions { display: none; background: #e3f2fd; padding: 0.75rem 1rem; border-radius: 8px; }
.bulk-actions.show { display: flex; }
.row-checkbox { cursor: pointer; }
tr.selected { background-color: #e3f2fd !important; }
```

4. **Required JS** (initialize tooltips on all pages)
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
});
```

### Table Structure Template
```html
<!-- Bulk Actions Toolbar -->
<div class="bulk-actions mb-3" id="bulkActions">
  <span class="me-3"><strong id="selectedCount">0</strong> selected</span>
  <button class="btn btn-sm btn-outline-danger" data-bs-toggle="tooltip" title="Delete selected">
    <i class="bi bi-trash"></i> Delete Selected
  </button>
</div>

<div class="card">
  <div class="card-body p-0">
    <table class="table table-hover mb-0">
      <thead class="table-light">
        <tr>
          <th style="width: 40px;">
            <input type="checkbox" class="form-check-input" id="selectAll" data-bs-toggle="tooltip" title="Select all">
          </th>
          <!-- other columns -->
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tableBody">
        <!-- rows with checkboxes -->
      </tbody>
    </table>
  </div>

  <!-- Pagination Footer -->
  <div class="card-footer bg-white d-flex justify-content-between align-items-center">
    <div class="text-muted small">Showing <span id="showingStart">1</span>-<span id="showingEnd">10</span> of <span id="totalRows">0</span></div>
    <nav>
      <ul class="pagination pagination-sm mb-0" id="pagination">
        <!-- pagination controls -->
      </ul>
    </nav>
    <select class="form-select form-select-sm" id="pageSize" style="width: auto;">
      <option value="10">10 / page</option>
      <option value="25">25 / page</option>
      <option value="50">50 / page</option>
    </select>
  </div>
</div>
```

## Public Pages

### Landing Page (`/`)
- Public-facing splash page with branding
- Features: Hero section, How it works, Features grid, Pricing preview
- Demo quick-login section with all 5 user roles

### Authentication Pages (`/auth/*`)
- `/auth/login` - Login page with demo user quick-login buttons
- `/auth/register` - Registration with company name, domain, industry, size
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form

### Registration Fields
- **Company Information**: Name, Domain, Industry, Company Size
- **Account Information**: Full Name, Email, Password
- **Industry Options**: Technology, Healthcare, Finance & Banking, Retail & E-commerce, Manufacturing, Education, Government, Non-Profit, Professional Services, Media & Entertainment, Real Estate, Transportation & Logistics, Energy & Utilities, Hospitality & Tourism, Other
- **Company Sizes**: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+

## Tech Stack
- Backend: Node.js + Express + TypeScript
- Database: Prisma + PostgreSQL
- Frontend: EJS templates + Bootstrap 5 + Bootstrap Icons
- Real-time: WebSockets (OpenAI Realtime API)
- Authentication: JWT tokens + bcrypt password hashing

## File Structure
- `src/` - Backend TypeScript source
- `src/middleware/rbac.ts` - Role-based access control middleware
- `src/routes/admin.ts` - Admin panel routes
- `src/routes/auth.ts` - Authentication API routes
- `src/routes/authViews.ts` - Authentication view routes
- `views/` - EJS templates
- `views/admin/` - Admin panel pages
- `views/admin/_sidebar.ejs` - Role-aware sidebar navigation
- `views/admin/trial-codes.ejs` - Trial codes management
- `views/admin/my-subscription.ejs` - User subscription view
- `views/admin/pricing.ejs` - Pricing plans page
- `views/admin/account.ejs` - Account settings
- `views/auth/` - Authentication pages
- `views/landing.ejs` - Public landing page
- `prisma/` - Database schema and migrations
- `prisma/seed.ts` - Database seeding with demo users

## Admin Panel Routes
- All admin routes require `?token=<ADMIN_TOKEN>` query parameter
- Add `&role=ROLE_NAME` to test different role permissions
- Default role is SUPER_ADMIN when using admin token

## Branding
- Primary Color: `#0d9488` (Teal)
- Secondary Color: `#0f766e`
- Accent Color: `#14b8a6`
- Branding is stored in database and applied dynamically via CSS variables

## Docker Deployment

### Configuration
- **Port**: 8085
- **Base Path**: `/RecruitingAI/`
- **URLs**:
  - Landing Page: `http://localhost:8085/RecruitingAI/`
  - Login: `http://localhost:8085/RecruitingAI/login`
  - Register: `http://localhost:8085/RecruitingAI/register`
  - Admin Panel: `http://localhost:8085/RecruitingAI/admin?token=admin`

### Commands
```bash
# Build and start
docker compose build --no-cache
docker compose up -d

# View logs
docker logs recruiting_ai-docker-app-1

# Restart
docker compose down && docker compose up -d

# Reset database
docker compose down
rm -rf data/
docker compose up -d
```

---

## Logging

Pino-based logging with pretty printing in development:

```
src/utils/logger.ts
```

### Features
- **Pino Logger**: Fast, low-overhead JSON logging
- **Pretty Printing**: Colorized output in development with pino-pretty
- **Log Levels**: Configurable via LOG_LEVEL environment variable
- **Timestamps**: Human-readable timestamps in development
- **Production Mode**: Raw JSON output for log aggregation

### Log Levels
- `fatal` - Critical errors
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages (default)
- `debug` - Debug information
- `trace` - Trace-level logging

### Usage
```typescript
import logger from '../utils/logger';

logger.info('Interview session started');
logger.error({ error: err.message }, 'Database connection failed');
logger.debug({ candidateId, jobRole }, 'Processing interview');
```

### Configuration
```bash
# Environment variable
LOG_LEVEL=debug  # Set log level (default: info)
```

## Subscription Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free Trial | $0/month | 3 interviews/month, basic features |
| Non-Profit | $9.99/month | 50 interviews/month, email support |
| Professional | $29.99/month | 200 interviews/month, priority support, analytics |
| Premium | $59.00/month | Unlimited interviews, dedicated support, API access |

## Key Features
- AI-powered interview scheduling and conducting
- Multi-tenant architecture with company management
- Job role and question bank configuration

## Payment Gateways
All 5 payment gateways are fully integrated:

| Gateway | Status | Test Mode Support |
|---------|--------|-------------------|
| **Stripe** | Full integration | Sandbox/Production |
| **PayPal** | Full integration | Sandbox/Production |
| **Square** | Full integration | Sandbox/Production |
| **Braintree** | Full integration | Sandbox/Production |
| **Authorize.net** | Full integration | Test/Live mode |

### Payment Services Location
```
src/services/payments/
├── stripe.service.ts     # Stripe payment processing
├── paypal.service.ts     # PayPal order management
├── square.service.ts     # Square payment processing
├── braintree.service.ts  # Braintree transactions
├── authorize.service.ts  # Authorize.net processing
├── payment.service.ts    # Unified payment orchestrator
└── index.ts              # Service exports
```
- Real-time WebSocket interview sessions
- MS Teams integration
- Role-based access control (5-tier)
- Analytics and reporting

---

## Agent Capabilities

When working on this project, apply these specialized behaviors:

### Backend Architect
- Design Express routes for interviews, candidates, job roles
- Implement 5-tier RBAC (SUPER_ADMIN to CANDIDATE)
- Structure multi-tenant company isolation
- Handle real-time interview session management

### AI Engineer
- Design professional AI interviewer persona
- Implement dynamic question flow based on job role
- Handle candidate response evaluation
- Process follow-up questions intelligently
- Provide objective performance scoring

### Database Admin
- Prisma schema for Companies, Users, Interviews, JobRoles, Questions
- Track candidate progress and interview history
- Store question banks by role and category
- Handle interview recordings and transcripts

### Security Auditor
- Protect candidate personal information
- Implement proper RBAC at all levels
- Secure interview data and recordings
- Review company-level data isolation

### Content Creator
- Write interview questions for various job roles
- Create evaluation rubrics and scoring criteria
- Design feedback templates for candidates
- Structure onboarding communications

### UX Researcher
- Design smooth interview flow for candidates
- Implement role-appropriate admin interfaces
- Test with different user role perspectives
- Optimize candidate experience

### Code Reviewer
- Enforce TypeScript best practices
- Review RBAC implementation consistency
- Validate multi-tenant data isolation
- Check WebSocket connection handling
