# Technical Architecture Specification
# AI Recruiting Digital Assistant

_Last updated: 2025-12-15_

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Layer                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Super Admin Portal  │  Company Admin Portal  │  Manager Dashboard   │
│  (Create companies)  │  (Users, Questions)    │  (Interviews)        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway / Express                           │
├─────────────────────────────────────────────────────────────────────┤
│  Auth Middleware  │  Tenant Isolation  │  Rate Limiting              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│   Core Services      │ │  AI Services     │ │  Integration Layer   │
├──────────────────────┤ ├──────────────────┤ ├──────────────────────┤
│ • Company Service    │ │ • LLM Orchestr.  │ │ • Teams Adapter      │
│ • User Service       │ │ • Transcription  │ │ • Calendar Adapter   │
│ • JobRole Service    │ │ • Summarization  │ │ • Email Adapter      │
│ • Question Service   │ │ • Scoring        │ │ • (Twilio Adapter)   │
│ • Interview Service  │ │ • Follow-ups     │ │                      │
└──────────────────────┘ └──────────────────┘ └──────────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│  SQLite/Postgres (Prisma)  │  Redis (Sessions)  │  Blob Storage      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20+ | Async-first, excellent for webhooks |
| **Framework** | Express + TypeScript | Existing codebase foundation |
| **Database** | SQLite (dev) → Postgres (prod) | Prisma ORM, easy migration path |
| **Cache** | Redis | Session state, rate limiting |
| **Real-time** | WebSockets | Interview live updates |
| **Templates** | EJS + Bootstrap 5 | Per CLAUDE.md conventions |
| **AI** | OpenAI API | GPT-4 for summaries, Whisper for STT |
| **Teams** | Microsoft Graph API | Meeting creation, bot registration |

---

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

**Approach: Shared Database with Row-Level Isolation**

Every table that stores tenant data includes a `companyId` foreign key. All queries filter by the authenticated user's company.

```typescript
// Middleware: Inject companyId into all queries
const tenantMiddleware = (req, res, next) => {
  const user = req.user; // From auth
  req.companyId = user.companyId;
  next();
};

// Service: Always filter by companyId
async function getQuestions(companyId: string, jobRoleId: string) {
  return prisma.question.findMany({
    where: {
      companyId,  // Always include tenant filter
      category: { jobRoleId }
    }
  });
}
```

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auth Flow                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Login Request                                                │
│     └─► Validate credentials                                     │
│         └─► Create session (JWT or cookie)                       │
│             └─► Include: userId, companyId, role                 │
│                                                                  │
│  2. API Request                                                  │
│     └─► Auth middleware validates session                        │
│         └─► Role middleware checks permissions                   │
│             └─► Tenant middleware injects companyId              │
│                 └─► Service executes with tenant filter          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Platform-level
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER'
}

const permissions = {
  'company:create': [Role.SUPER_ADMIN],
  'company:read': [Role.SUPER_ADMIN, Role.COMPANY_ADMIN],
  'user:manage': [Role.COMPANY_ADMIN],
  'question:manage': [Role.COMPANY_ADMIN],
  'interview:conduct': [Role.COMPANY_ADMIN, Role.MANAGER],
  'interview:view_all': [Role.COMPANY_ADMIN],
  'interview:view_own': [Role.MANAGER],
};
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Switch to "postgresql" for production
  url      = env("DATABASE_URL")
}

// ============== PLATFORM LEVEL ==============

model SuperAdmin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
}

// ============== COMPANY LEVEL ==============

model Company {
  id        String   @id @default(uuid())
  name      String
  domain    String   @unique
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users             User[]
  jobRoles          JobRole[]
  questionCategories QuestionCategory[]
  interviews        Interview[]
}

model User {
  id        String   @id @default(uuid())
  email     String
  password  String
  name      String
  role      Role     @default(MANAGER)
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  interviewSessions InterviewSession[]

  @@unique([email, companyId])
}

enum Role {
  COMPANY_ADMIN
  MANAGER
}

// ============== JOB ROLES & QUESTIONS ==============

model JobRole {
  id          String   @id @default(uuid())
  title       String
  description String?
  isActive    Boolean  @default(true)
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  categories QuestionCategory[]
  interviews Interview[]
}

model QuestionCategory {
  id        String   @id @default(uuid())
  name      String   // Technical, Behavioral, Culture Fit, etc.
  order     Int      @default(0)
  jobRoleId String
  jobRole   JobRole  @relation(fields: [jobRoleId], references: [id], onDelete: Cascade)
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())

  questions Question[]

  @@unique([name, jobRoleId])
}

model Question {
  id                 String           @id @default(uuid())
  text               String
  followUps          Json             @default("[]")  // String array
  evaluationCriteria String?
  timeAllocation     Int              @default(5)     // Minutes
  isRequired         Boolean          @default(false)
  order              Int              @default(0)
  categoryId         String
  category           QuestionCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
}

// ============== INTERVIEWS ==============

model Interview {
  id             String          @id @default(uuid())
  candidateName  String
  candidateEmail String
  mode           InterviewMode   @default(HYBRID)
  status         InterviewStatus @default(SCHEDULED)
  scheduledAt    DateTime
  jobRoleId      String
  jobRole        JobRole         @relation(fields: [jobRoleId], references: [id])
  companyId      String
  company        Company         @relation(fields: [companyId], references: [id])
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  sessions InterviewSession[]
  result   InterviewResult?
}

enum InterviewMode {
  AI_ONLY
  HYBRID
}

enum InterviewStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

model InterviewSession {
  id              String    @id @default(uuid())
  teamsMeetingUrl String?
  teamsJoinUrl    String?
  startedAt       DateTime?
  endedAt         DateTime?
  interviewId     String
  interview       Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  managerId       String?
  manager         User?     @relation(fields: [managerId], references: [id])
  createdAt       DateTime  @default(now())
}

model InterviewResult {
  id           String    @id @default(uuid())
  transcript   String?   @db.Text  // Full transcript
  summary      String?   @db.Text  // AI-generated summary
  scorecard    Json      @default("{}")  // Structured scores
  managerNotes String?   @db.Text
  interviewId  String    @unique
  interview    Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

---

## API Routes Structure

```
/api
├── /auth
│   ├── POST /login              # User login
│   ├── POST /logout             # User logout
│   └── GET  /me                 # Current user info
│
├── /super-admin                 # Super admin only
│   ├── GET    /companies        # List all companies
│   ├── POST   /companies        # Create company
│   └── DELETE /companies/:id    # Delete company
│
├── /admin                       # Company admin only
│   ├── /users
│   │   ├── GET    /             # List company users
│   │   ├── POST   /             # Create user
│   │   ├── PUT    /:id          # Update user
│   │   └── DELETE /:id          # Delete user
│   │
│   ├── /job-roles
│   │   ├── GET    /             # List job roles
│   │   ├── POST   /             # Create job role
│   │   ├── PUT    /:id          # Update job role
│   │   └── DELETE /:id          # Archive job role
│   │
│   └── /questions
│       ├── GET    /             # List questions (filter by jobRole, category)
│       ├── POST   /             # Create question
│       ├── PUT    /:id          # Update question
│       ├── DELETE /:id          # Delete question
│       └── POST   /import       # Bulk import from CSV
│
├── /interviews                  # Admin + Manager
│   ├── GET    /                 # List interviews (filtered by role)
│   ├── POST   /                 # Schedule interview
│   ├── GET    /:id              # Get interview details
│   ├── PUT    /:id              # Update interview
│   ├── DELETE /:id              # Cancel interview
│   └── GET    /:id/result       # Get interview result
│
└── /webhooks                    # External integrations
    └── POST /teams              # Teams meeting events
```

---

## Microsoft Teams Integration Architecture

### Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Teams Integration Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Schedule Interview                                              │
│  ─────────────────                                               │
│  1. Admin creates interview in app                               │
│  2. App calls Microsoft Graph API                                │
│     └─► POST /me/onlineMeetings                                  │
│  3. Graph returns meeting URL + join info                        │
│  4. App sends calendar invites (Graph Calendar API)              │
│  5. App stores teamsMeetingUrl in InterviewSession               │
│                                                                  │
│  During Interview (Phase 2+)                                     │
│  ─────────────────────────                                       │
│  1. Teams bot joins meeting                                      │
│  2. Bot captures audio stream                                    │
│  3. Audio → Whisper STT → Transcript                             │
│  4. Transcript → GPT-4 → Follow-up suggestions                   │
│  5. Manager sees suggestions in dashboard                        │
│  6. Manager clicks to have AI ask question                       │
│                                                                  │
│  Post Interview                                                  │
│  ──────────────                                                  │
│  1. Meeting ends webhook fires                                   │
│  2. App generates AI summary                                     │
│  3. App generates scorecard                                      │
│  4. Results saved to InterviewResult                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Teams Adapter Interface

```typescript
// src/adapters/teams/TeamsAdapter.ts

interface TeamsAdapter {
  // Meeting Management
  createMeeting(options: CreateMeetingOptions): Promise<TeamsMeeting>;
  updateMeeting(meetingId: string, options: UpdateMeetingOptions): Promise<TeamsMeeting>;
  cancelMeeting(meetingId: string): Promise<void>;

  // Calendar
  createCalendarEvent(event: CalendarEvent): Promise<string>;
  sendMeetingInvite(meeting: TeamsMeeting, attendees: string[]): Promise<void>;

  // Bot (Phase 2)
  joinMeeting(meetingUrl: string): Promise<BotSession>;
  leaveMeeting(sessionId: string): Promise<void>;

  // Audio (Phase 2)
  startAudioCapture(sessionId: string): AsyncIterable<AudioChunk>;
  playAudio(sessionId: string, audioUrl: string): Promise<void>;
}

interface CreateMeetingOptions {
  subject: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
}

interface TeamsMeeting {
  id: string;
  joinUrl: string;
  joinWebUrl: string;
  subject: string;
}
```

---

## Folder Structure

```
src/
├── server.ts                    # Main Express app
├── adminServer.ts               # Admin panel server
│
├── config/
│   └── index.ts                 # Environment config
│
├── middleware/
│   ├── auth.ts                  # JWT/session validation
│   ├── rbac.ts                  # Role-based access control
│   └── tenant.ts                # Multi-tenant isolation
│
├── routes/
│   ├── auth.ts                  # /api/auth
│   ├── superAdmin.ts            # /api/super-admin
│   ├── admin.ts                 # /api/admin (existing, extend)
│   ├── interviews.ts            # /api/interviews
│   └── webhooks.ts              # /api/webhooks
│
├── services/
│   ├── companyService.ts
│   ├── userService.ts
│   ├── jobRoleService.ts
│   ├── questionService.ts
│   ├── interviewService.ts
│   └── ai/
│       ├── summarizer.ts        # Generate interview summaries
│       ├── scorer.ts            # Generate scorecards
│       └── followUpGenerator.ts # Suggest follow-up questions
│
├── adapters/
│   ├── teams/
│   │   ├── TeamsAdapter.ts      # Interface
│   │   ├── GraphClient.ts       # Microsoft Graph API client
│   │   └── TeamsBot.ts          # Bot framework (Phase 2)
│   │
│   ├── calendar/
│   │   └── CalendarAdapter.ts
│   │
│   └── email/
│       └── EmailAdapter.ts
│
├── db/
│   └── prisma.ts                # Prisma client singleton
│
└── realtime/
    └── interviewHandler.ts      # WebSocket for live interviews

views/
├── admin/
│   ├── companies/               # Super admin: company management
│   ├── users/                   # Company admin: user management
│   ├── job-roles/               # Company admin: job role management
│   ├── questions/               # Company admin: question bank
│   └── interviews/              # All: interview management
│
└── partials/
    └── ...

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

---

## Security Considerations

### Data Protection

| Concern | Mitigation |
|---------|------------|
| Tenant data leakage | Row-level companyId filtering on all queries |
| Password storage | bcrypt hashing with salt rounds >= 12 |
| Session hijacking | HttpOnly cookies, secure flag in prod |
| API abuse | Rate limiting per user/company |
| PII in transcripts | Retention policies, redaction pipelines |

### Compliance

- **Consent**: Record explicit candidate consent before transcription
- **Retention**: Configurable data retention per company
- **Audit**: Log all access to candidate data
- **Export**: GDPR-compliant data export capability

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure (Recommended)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Azure CDN   │───►│ App Service │───►│ Postgres    │          │
│  │ (Static)    │    │ (Node.js)   │    │ (Azure DB)  │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                                     │
│                            ▼                                     │
│                     ┌─────────────┐    ┌─────────────┐          │
│                     │ Redis Cache │    │ Blob Storage │          │
│                     │ (Sessions)  │    │ (Recordings) │          │
│                     └─────────────┘    └─────────────┘          │
│                            │                                     │
│                            ▼                                     │
│                     ┌─────────────┐                              │
│                     │ Azure Bot   │                              │
│                     │ Service     │                              │
│                     └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Foundation (Now)
1. Update Prisma schema with new models
2. Implement multi-tenant middleware
3. Build company/user management APIs
4. Build job role/question CRUD
5. Create admin UI pages

### Phase 2: Scheduling
1. Microsoft Graph API integration
2. Teams meeting creation
3. Calendar invite sending
4. Interview scheduling flow

### Phase 3: Live Interview
1. Teams bot registration
2. Audio capture and STT
3. Real-time transcript display
4. Manager controls UI
5. AI follow-up suggestions

### Phase 4: Intelligence
1. Interview summarization
2. Scorecard generation
3. Analytics dashboard
