# RecruitingAI - AI Interview Assistant

**Type:** Recruiting/Interview Application
**Port:** 8085
**URL Prefix:** `/RecruitingAI/`

---

## Quick Start

```bash
# Build and start the application
docker compose build --no-cache
docker compose up -d

# Access URLs
# Landing Page: http://localhost:8085/RecruitingAI/
# Login: http://localhost:8085/RecruitingAI/login
# Register: http://localhost:8085/RecruitingAI/register
# Admin Panel: http://localhost:8085/RecruitingAI/admin?token=admin
```

---

## Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@system.local | superadmin123 |
| Company Admin | admin@demo.local | admin123 |
| Manager | manager@demo.local | manager123 |
| Supervisor | supervisor@demo.local | supervisor123 |
| Candidate | candidate@demo.local | candidate123 |

---

## Features Overview

### Public Pages
- **Landing Page** - Professional splash page with features, pricing, and demo access
- **Login** - Authentication with quick demo login buttons
- **Register** - Company registration with industry selection

### Recruiting Management
- **Interviews** - AI-powered interview scheduling, conducting, and tracking
- **Job Roles** - Position configuration with custom questions
- **Questions** - Question banks organized by role
- **Candidates** - Candidate profiles and application tracking

### Role-Based Access Control (RBAC)
5-tier hierarchical access system:
1. **SUPER_ADMIN** - Full system access, manages all companies
2. **COMPANY_ADMIN** - Manages company settings, users, billing
3. **MANAGER** - Manages interviews, job roles, questions
4. **SUPERVISOR** - Views candidates, interviews, reports (read-only)
5. **CANDIDATE** - Views own interviews only

### AI Configuration
- AI Config - Model settings and parameters
- AI Agents - Interview conductor personas
- AI Tools - Function calling capabilities
- Knowledge Base - Company and role information
- Logic Rules - Conditional AI behaviors
- Functions - Custom automation

### Communication
- SMS Settings - Twilio integration for notifications
- Call Transfer - Redirect to human interviewers
- DTMF Menu - Touch-tone navigation
- Webhooks - External integrations

### Integrations
- MS Teams - Schedule and conduct interviews via Teams
- Azure Bot Service - Enterprise bot integration

### Billing
- Payment processing (Stripe, PayPal, Square)
- Subscription management
- Multi-tenant billing

---

## Database Schema

### Key Models
- `Interview` - Interview sessions with status tracking
- `JobRole` - Position definitions with requirements
- `Question` - Interview questions by category
- `Company` - Multi-tenant organizations
- `User` - System users with RBAC roles
- `Payment` - Billing and transaction records
- `AIAgent` - AI interviewer configurations
- `AITool` - Function calling definitions

### Multi-Tenancy
Uses `Company` model with `companyId` foreign key for tenant isolation.

---

## Color Theme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Teal | `#0d9488` |
| Secondary | Dark Teal | `#0f766e` |
| Accent | Light Teal | `#14b8a6` |

---

## Subscription Pricing

| Tier | Price | Interviews | Features |
|------|-------|------------|----------|
| Free Trial | $0/month | 3/month | Basic features |
| Non-Profit | $9.99/month | 50/month | Email support |
| Professional | $29.99/month | 200/month | Priority support, analytics |
| Premium | $59.00/month | Unlimited | Dedicated support, API access |

---

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** Prisma ORM + SQLite
- **Frontend:** EJS templates + Bootstrap 5.3.2 + Bootstrap Icons
- **Real-time:** WebSockets (OpenAI Realtime API)
- **Authentication:** JWT tokens + bcrypt

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project conventions
- [setup-guide.md](./setup-guide.md) - Installation guide
- [admin-guide.md](./admin-guide.md) - Admin panel usage
- [AZURE_BOT_SETUP.md](./AZURE_BOT_SETUP.md) - Azure Bot integration
- [PHASE3_WEB_INTERVIEW.md](./PHASE3_WEB_INTERVIEW.md) - Web interview implementation
- [CRM_INTEGRATION.md](./CRM_INTEGRATION.md) - CRM integration guide
- [multi-tenant-architecture.md](./multi-tenant-architecture.md) - Multi-tenancy design
