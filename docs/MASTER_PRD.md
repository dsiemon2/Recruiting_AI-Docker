# AI Recruiting Assistant - Master PRD

_Last Updated: 2025-12-17_
_Version: 1.0_

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Implementation Stages](#implementation-stages)
4. [Stage 1: MVP Foundation](#stage-1-mvp-foundation)
5. [Stage 2: Core Platform](#stage-2-core-platform)
6. [Stage 3: AI Interview System](#stage-3-ai-interview-system)
7. [Stage 4: Intelligence & Analytics](#stage-4-intelligence--analytics)
8. [Stage 5: Enterprise Features](#stage-5-enterprise-features)
9. [Stage 6: Advanced Integrations](#stage-6-advanced-integrations)
10. [Technical Architecture](#technical-architecture)
11. [Authentication & Security](#authentication--security)
12. [UI/UX Requirements](#uiux-requirements)
13. [Non-Goals & Constraints](#non-goals--constraints)
14. [Related Documents](#related-documents)

---

## Executive Summary

The AI Recruiting Assistant is a SaaS platform that automates and enhances the interview process using AI. It conducts structured interviews, generates objective evaluations, and helps companies standardize their hiring while reducing interviewer bias.

### Key Value Propositions

- **For Companies**: Standardized interviews, reduced time-to-hire, objective evaluations
- **For Recruiters**: Automated screening, AI-generated scorecards, scheduling automation
- **For Candidates**: Consistent experience, flexible scheduling, professional interactions

---

## Product Vision

### Target Users

| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| Super Admin | Platform operator | Manage tenants, billing, system config |
| Company Admin | HR Director / Head of Recruiting | Company setup, user management, reporting |
| Manager | Hiring Manager | Review interviews, approve hires, add notes |
| Recruiter | Day-to-day user | Schedule interviews, manage candidates |
| Candidate | External (interview participant) | Easy access, clear instructions, fair process |

### Interview Modes

1. **AI-Only Mode**: Fully autonomous AI conducts the interview
2. **Hybrid Mode**: AI assists while manager observes and can intervene
3. **Scheduled Mode**: AI handles scheduling, humans conduct interview

---

## Implementation Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION ROADMAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: MVP Foundation                                    [COMPLETE]      │
│  └── Database, Admin Panel, Basic CRUD                                      │
│                                                                              │
│  STAGE 2: Core Platform                                     [COMPLETE]      │
│  └── Auth, Multi-tenancy, Teams Scheduling                                  │
│                                                                              │
│  STAGE 3: AI Interview System                               [COMPLETE]      │
│  └── Web Interview, STT/TTS, Real-time Engine                               │
│                                                                              │
│  STAGE 4: Intelligence & Analytics                          [NOT STARTED]   │
│  └── Summaries, Scorecards, Reports                                         │
│                                                                              │
│  STAGE 5: Enterprise Features                               [NOT STARTED]   │
│  └── SSO, Advanced RBAC, Audit Logs                                         │
│                                                                              │
│  STAGE 6: Advanced Integrations                             [NOT STARTED]   │
│  └── Teams Bot, ATS Integration, Zoom                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: MVP Foundation

**Status: COMPLETE**

### 1.1 Database Schema

- [x] Multi-tenant data model with `companyId` isolation
- [x] User model with roles (SUPER_ADMIN, COMPANY_ADMIN, MANAGER)
- [x] Company model with settings
- [x] JobRole model with categories
- [x] Question model with follow-ups
- [x] Interview model with sessions
- [x] InterviewResult model for outcomes
- [x] App configuration tables

### 1.2 Admin Panel UI

- [x] Dashboard with stats
- [x] Job Roles CRUD
- [x] Questions CRUD with bulk import (CSV, Excel, Word)
- [x] Interview scheduling
- [x] AI Configuration pages
- [x] Voice selection
- [x] Company management (Super Admin)
- [x] User management

### 1.3 API Foundation

- [x] Express + TypeScript server
- [x] RESTful API structure
- [x] Prisma ORM integration
- [x] Error handling middleware
- [x] Request validation (Zod)

---

## Stage 2: Core Platform

**Status: COMPLETE**

### 2.1 Authentication System

- [x] JWT-based authentication
- [x] Token refresh mechanism
- [x] Password hashing (bcrypt)
- [x] Session management
- [ ] **Create Account flow** (public registration)
- [ ] **OAuth Providers**:
  - [ ] Google OAuth 2.0
  - [ ] Microsoft OAuth (Azure AD)
  - [ ] Apple ID Sign-In
- [ ] Email/username login option
- [ ] Password reset via email
- [ ] Email verification

### 2.2 Multi-Tenancy

- [x] Row-level isolation with `companyId`
- [x] Tenant middleware
- [x] Scoped queries per tenant

### 2.3 Role-Based Access Control (RBAC)

- [x] Basic role enforcement (SUPER_ADMIN, COMPANY_ADMIN, MANAGER)
- [ ] **Fine-grained permissions system**:
  - [ ] Permission definitions table
  - [ ] Role-permission mappings
  - [ ] Resource-level permissions
  - [ ] UI permission checks
- [ ] **Custom roles per company**
- [ ] **Permission inheritance**

### 2.4 Microsoft Teams Integration (Scheduling)

- [x] Azure AD app registration
- [x] Microsoft Graph client
- [x] Create Teams meetings
- [x] Calendar integration
- [x] Admin UI for Teams settings

---

## Stage 3: AI Interview System

**Status: COMPLETE**

### 3.1 Web-Based Interview Platform

- [x] Candidate interview page (`/interview/:token`)
- [x] Manager dashboard for hybrid mode
- [x] Token-based access (no login required for candidates)
- [x] Session state management
- [x] Error and completion pages

### 3.2 Real-Time Communication

- [x] WebSocket server for interview sessions
- [x] Audio streaming from browser
- [x] Real-time transcript updates
- [x] Manager/candidate synchronization

### 3.3 Speech-to-Text (STT)

- [x] OpenAI Whisper API integration
- [x] Audio chunk processing (5-second buffers)
- [x] Real-time transcription
- [x] Speaker identification (AI vs Candidate)

### 3.4 Text-to-Speech (TTS)

- [x] OpenAI TTS API integration
- [x] Multiple voice options (alloy, echo, fable, onyx, nova, shimmer)
- [x] Audio streaming to client

### 3.5 AI Interview Engine

- [x] Interview state machine (INTRO → QUESTIONING → FOLLOW_UP → CLOSING → COMPLETED)
- [x] Question flow controller
- [x] GPT-4o integration for follow-up generation
- [x] Time management per question
- [x] Graceful interview closing

### 3.6 Interview Session Management

- [x] Generate unique interview tokens
- [x] Token expiration handling
- [x] Session status tracking
- [x] Transcript storage

---

## Stage 4: Intelligence & Analytics

**Status: NOT STARTED**

### 4.1 Interview Summarization

- [ ] GPT-4 powered summary generation
- [ ] Key points extraction
- [ ] Candidate strengths/weaknesses identification
- [ ] Notable quotes extraction
- [ ] Auto-generated executive summary

### 4.2 Scorecard Generation

- [ ] Structured scoring per question category
- [ ] Rubric-based evaluation
- [ ] Overall recommendation (Strong Yes → Strong No)
- [ ] Comparison across candidates for same role
- [ ] Export to PDF

### 4.3 Analytics Dashboard

- [ ] Interview metrics (completion rate, avg duration)
- [ ] Question effectiveness analysis
- [ ] Time-to-hire tracking by role
- [ ] Source-to-hire funnel
- [ ] Interviewer performance metrics
- [ ] Trend charts and visualizations

### 4.4 AI-Powered Insights

- [ ] Real-time follow-up suggestions during hybrid mode
- [ ] Context-aware probing questions
- [ ] Red flag detection
- [ ] Skill gap analysis

---

## Stage 5: Enterprise Features

**Status: NOT STARTED**

### 5.1 Advanced Authentication

- [ ] SAML 2.0 SSO
- [ ] OIDC support
- [ ] Directory sync (Azure AD, Okta, etc.)
- [ ] Multi-factor authentication (MFA)
- [ ] Session management policies

### 5.2 Advanced RBAC

- [ ] Custom permission sets
- [ ] Role builder UI
- [ ] Department-based access
- [ ] Interview panel permissions
- [ ] Data visibility controls

### 5.3 Compliance & Audit

- [ ] Immutable audit logs
- [ ] Data retention policies
- [ ] GDPR compliance tools (data export, deletion)
- [ ] SOC 2 readiness
- [ ] Interview recording consent management

### 5.4 Enterprise Administration

- [ ] Bulk user provisioning
- [ ] API key management
- [ ] Usage quotas and limits
- [ ] Custom branding per company
- [ ] White-label deployment options

---

## Stage 6: Advanced Integrations

**Status: NOT STARTED**

### 6.1 Microsoft Teams Bot (In-Meeting)

- [ ] Azure Bot Service registration
- [ ] Bot Framework SDK implementation
- [ ] Real-time media access
- [ ] Join meetings as bot participant
- [ ] Audio capture and processing

> **Note**: Deferred due to hosting costs (~$100-200/month Azure VM).
> See `AZURE_BOT_SETUP.md` for implementation details.

### 6.2 ATS Integrations

- [ ] Greenhouse API integration
- [ ] Lever API integration
- [ ] Workday integration
- [ ] iCIMS integration
- [ ] SmartRecruiters integration
- [ ] Candidate sync
- [ ] Interview stage updates
- [ ] Scorecard push

### 6.3 Additional Conferencing

- [ ] Zoom meeting creation
- [ ] Google Meet + Calendar integration
- [ ] Cisco Webex support

### 6.4 Communication Channels

- [ ] Email notifications (SendGrid/SES)
- [ ] SMS reminders (Twilio)
- [ ] Slack notifications
- [ ] Microsoft Teams chat notifications

### 6.5 Webhook System

- [ ] Outbound webhooks for events
- [ ] Webhook management UI
- [ ] Retry logic and logging
- [ ] Signature verification

---

## Technical Architecture

### Core Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Backend | Node.js + Express + TypeScript | Main API server |
| Database | SQLite (dev) / PostgreSQL (prod) | Via Prisma ORM |
| Frontend | EJS + Bootstrap 5 | Server-rendered admin |
| Real-time | WebSocket (ws) | Interview sessions |
| AI | OpenAI GPT-4o, Whisper, TTS | Core AI services |
| Auth | JWT + bcrypt | Session tokens |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Admin Panel │  │ Candidate   │  │ Manager     │  │ External (ATS/Teams)│ │
│  │ (EJS/BS5)   │  │ Interview   │  │ Dashboard   │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / ROUTER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /api/*        REST API endpoints                                    │    │
│  │  /admin/*      Admin panel routes                                    │    │
│  │  /interview/*  Candidate-facing interview routes                     │    │
│  │  /ws/*         WebSocket connections                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Interview    │  │ AI Services  │  │ Teams        │  │ Auth         │     │
│  │ Service      │  │ (STT/TTS/LLM)│  │ Adapter      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Prisma ORM                                   │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │  │Company  │  │User     │  │JobRole  │  │Interview│  │Result   │   │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│                          SQLite / PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── routes/              # Express route handlers
│   ├── admin.ts         # Admin panel routes
│   ├── auth.ts          # Authentication endpoints
│   ├── interviews.ts    # Interview API
│   ├── interviewSession.ts  # Web interview routes
│   ├── jobRoles.ts      # Job role management
│   ├── questions.ts     # Question bank
│   └── teams.ts         # Teams integration
│
├── services/            # Business logic
│   ├── ai/              # AI services
│   │   ├── interviewEngine.ts
│   │   ├── whisperClient.ts
│   │   └── ttsClient.ts
│   ├── interviewService.ts
│   └── userService.ts
│
├── adapters/            # External service adapters
│   └── teams/
│       ├── GraphClient.ts
│       └── TeamsService.ts
│
├── realtime/            # WebSocket handlers
│   └── interviewHandler.ts
│
├── middleware/          # Express middleware
│   ├── auth.ts
│   ├── rbac.ts
│   └── tenant.ts
│
├── db/                  # Database
│   └── prisma.ts
│
└── utils/               # Utilities
    └── logger.ts

views/
├── admin/               # Admin panel templates
├── interview/           # Candidate interview UI
└── partials/            # Shared components

prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Seed data
```

---

## Authentication & Security

### Current Implementation

- JWT tokens with refresh
- bcrypt password hashing
- Admin token for dev access
- Role-based middleware

### Required Enhancements

#### Create Account Flow

```
┌─────────────────────────────────────────────────────┐
│                  Registration Flow                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. User visits /register                           │
│  2. Chooses auth method:                            │
│     • Email/Password                                │
│     • Google OAuth                                  │
│     • Microsoft OAuth                               │
│     • Apple ID                                      │
│  3. Creates account                                 │
│  4. Email verification sent                         │
│  5. User verifies email                             │
│  6. Account activated                               │
│  7. Redirect to dashboard                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### OAuth Implementation

| Provider | SDK/Library | Scopes Required |
|----------|-------------|-----------------|
| Google | `passport-google-oauth20` | email, profile |
| Microsoft | `passport-azure-ad` | openid, profile, email |
| Apple | `apple-signin-auth` | name, email |

#### RBAC Permission Model

```typescript
// Permission structure
interface Permission {
  resource: string;  // e.g., 'interviews', 'users', 'reports'
  action: string;    // e.g., 'create', 'read', 'update', 'delete'
  scope: 'own' | 'team' | 'company' | 'all';
}

// Example role definitions
const roles = {
  SUPER_ADMIN: ['*:*:all'],
  COMPANY_ADMIN: [
    'users:*:company',
    'interviews:*:company',
    'settings:*:company',
  ],
  MANAGER: [
    'interviews:read:team',
    'interviews:update:own',
    'reports:read:team',
  ],
  RECRUITER: [
    'interviews:create:own',
    'interviews:read:own',
    'candidates:*:own',
  ],
};
```

---

## UI/UX Requirements

### Figma Wireframes Recommendation

**YES - Wireframes are recommended for:**

| Feature | Priority | Reason |
|---------|----------|--------|
| Registration/Login flow | HIGH | Critical user journey, OAuth complexity |
| Candidate interview experience | HIGH | Public-facing, must be polished |
| Manager hybrid dashboard | HIGH | Complex real-time UI |
| Analytics dashboard | MEDIUM | Data visualization design |
| Mobile responsive views | MEDIUM | Candidate access on phones |

**Can skip wireframes for:**
- Admin CRUD pages (use Bootstrap patterns)
- Settings pages (standard forms)
- Error pages (simple templates)

### Design System

- **Framework**: Bootstrap 5 + Bootstrap Icons
- **Colors**: Primary #1e3a5f (Navy), Accent #667eea (Purple)
- **Typography**: System fonts (fast loading)
- **Components**: Cards, tables with selection, tooltips on actions

### Key UI Patterns (from CLAUDE.md)

1. **All action buttons must have tooltips**
2. **All data tables must have**: row selection, pagination, bulk actions
3. **Admin token required**: `?token=<ADMIN_TOKEN>` on all admin routes

---

## Non-Goals & Constraints

### Non-Goals (Out of Scope)

- Video interviews (audio-only for MVP)
- Applicant Tracking System (ATS) - integrate with existing
- Job board posting
- Background checks
- Offer letter generation
- Mobile native apps (web-only)

### Constraints

- **Budget**: Avoid expensive Azure VM hosting ($100+/mo) until validated
- **Compliance**: Must support consent tracking for recordings
- **Performance**: Real-time audio must have <500ms latency
- **Browser Support**: Chrome, Firefox, Safari, Edge (modern versions)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `IMPLEMENTATION_PLAN.md` | Original phased plan |
| `PHASE3_WEB_INTERVIEW.md` | Web interview implementation details |
| `AZURE_BOT_SETUP.md` | Teams bot setup (deferred) |
| `ai-recruiting-assistant-conferencing-integrations.md` | Integration guide |
| `ai-recruiting-assistant-full-session.md` | Session notes on integrations |
| `MASTER_JIRA.md` | Jira epics and stories (separate document) |
| `MASTER_DEVOPS.md` | DevOps and deployment (separate document) |

---

## Appendix A: Environment Variables

```env
# Server
PORT=8050
NODE_ENV=development

# Database
DATABASE_URL=file:./dev.db

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ADMIN_TOKEN=admin

# OpenAI
OPENAI_API_KEY=sk-...

# Microsoft Graph (Teams)
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# OAuth Providers (Stage 5)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=

# Email (Stage 4)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@yourcompany.com
```

---

## Appendix B: API Overview

### Authentication
```
POST /api/auth/login          # Email/password login
POST /api/auth/register       # Create account
POST /api/auth/refresh        # Refresh token
POST /api/auth/logout         # Logout
POST /api/auth/google         # Google OAuth
POST /api/auth/microsoft      # Microsoft OAuth
POST /api/auth/apple          # Apple OAuth
```

### Interviews
```
GET    /api/interviews        # List interviews
POST   /api/interviews        # Create interview
GET    /api/interviews/:id    # Get interview
PUT    /api/interviews/:id    # Update interview
DELETE /api/interviews/:id    # Cancel interview
POST   /api/interviews/:id/session  # Create web session
```

### Web Interview (Candidate)
```
GET  /interview/:token         # Candidate interview page
GET  /interview/:token/manage  # Manager dashboard
GET  /interview/:token/status  # Session status
WS   /ws/interview             # Real-time connection
```

---

_End of Master PRD_
