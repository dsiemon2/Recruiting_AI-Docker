# AI Recruiting Assistant - Implementation Plan

_Created: 2025-12-15_

## Project Overview

An AI-powered recruiting assistant that conducts structured interviews via Microsoft Teams, helping companies standardize their hiring process, reduce interviewer bias, and generate objective candidate evaluations.

---

## Current State Analysis

### Already Implemented:
- Basic Express + TypeScript server (`src/adminServer.ts`)
- Prisma schema with multi-tenant models (Company, User, JobRole, Question, Interview)
- Admin panel UI (EJS templates with Bootstrap 5)
- Basic routes for CRUD operations
- Voices & Languages page
- Question import (CSV, Excel, Word)

### Missing/Incomplete:
- Full multi-tenant authentication flow
- Company onboarding workflow
- Interview scheduling with Teams integration
- Real-time interview execution
- AI-powered summaries and scorecards
- Proper session management

---

## Phased Implementation Plan

### PHASE 1: Foundation (Current Focus)

**Goal:** Complete the core admin functionality for managing companies, users, job roles, and questions.

#### 1.1 Authentication & Session Management
- [ ] Implement proper JWT-based authentication
- [ ] Super Admin login flow
- [ ] Company Admin / Manager login flow
- [ ] Session persistence with cookies
- [ ] Password hashing (bcrypt)

#### 1.2 Company Management (Super Admin)
- [ ] Create company form with validation
- [ ] Company list with pagination
- [ ] Edit company details
- [ ] Activate/deactivate company
- [ ] Company settings configuration

#### 1.3 User Management (Company Admin)
- [ ] Create user with role assignment
- [ ] User list with filtering by role
- [ ] Edit user profile
- [ ] Activate/deactivate user
- [ ] Password reset flow
- [ ] Email invitations

#### 1.4 Job Role Management
- [x] Create/edit job roles
- [x] Question categories per role
- [ ] Clone job role with questions
- [ ] Archive/restore job roles
- [ ] Question templates library

#### 1.5 Question Bank
- [x] CRUD for questions
- [x] Organize by category
- [x] Bulk import (CSV/Excel/Word)
- [ ] Question reordering (drag & drop)
- [ ] Question search/filter
- [ ] Export questions

#### 1.6 Interview Scheduling (Manual)
- [x] Create interview with candidate info
- [x] Assign job role
- [x] Select interview mode (AI-only/Hybrid)
- [ ] Assign manager(s) for hybrid mode
- [ ] Calendar view of interviews
- [ ] Interview status management

---

### PHASE 2: Microsoft Teams Integration

**Goal:** Integrate with Microsoft Graph API to create Teams meetings and send calendar invites.

#### 2.1 Azure AD App Registration
- [ ] Register app in Azure AD
- [ ] Configure permissions (Calendars.ReadWrite, OnlineMeetings.ReadWrite)
- [ ] Generate client secret
- [ ] Store credentials securely

#### 2.2 Microsoft Graph Client
- [ ] Create GraphClient service (`src/adapters/teams/GraphClient.ts`)
- [ ] Implement OAuth token acquisition
- [ ] Token refresh logic
- [ ] Error handling

#### 2.3 Meeting Creation
- [ ] Create Teams meeting via Graph API
- [ ] Store meeting URL in InterviewSession
- [ ] Generate meeting link for candidates
- [ ] Handle meeting updates/cancellations

#### 2.4 Calendar Integration
- [ ] Create calendar events for interviews
- [ ] Send invitations to participants
- [ ] Handle RSVPs
- [ ] Automated reminders (24h, 1h before)

#### 2.5 Webhooks
- [ ] Register webhook subscriptions
- [ ] Handle meeting lifecycle events (started, ended, etc.)
- [ ] Update interview status automatically

---

### PHASE 3: In-Meeting AI Assistant

**Goal:** Build a Teams bot that joins meetings, transcribes, and conducts AI interviews.

#### 3.1 Teams Bot Framework
- [ ] Register bot in Azure Bot Service
- [ ] Implement Bot Framework SDK
- [ ] Handle bot join/leave meeting
- [ ] Real-time media access

#### 3.2 Audio Capture & Transcription
- [ ] Capture meeting audio stream
- [ ] Send audio to Whisper API
- [ ] Real-time transcription display
- [ ] Speaker diarization

#### 3.3 AI-Only Interview Mode
- [ ] AI introduces itself to candidate
- [ ] AI asks questions from template
- [ ] AI generates follow-ups based on responses
- [ ] AI ends interview gracefully
- [ ] Time management per question

#### 3.4 Hybrid Interview Mode
- [ ] Manager dashboard with live transcript
- [ ] Question queue display
- [ ] "Next AI Question" button
- [ ] Follow-up suggestion panel
- [ ] Manager note-taking
- [ ] Coverage indicator

#### 3.5 Text-to-Speech
- [ ] OpenAI TTS for AI questions
- [ ] Voice selection per interview
- [ ] Natural conversation pacing

---

### PHASE 4: Intelligence & Analytics

**Goal:** Generate insights, summaries, and scorecards from interviews.

#### 4.1 Interview Summarization
- [ ] GPT-4 powered summary generation
- [ ] Key points extraction
- [ ] Candidate strengths/weaknesses
- [ ] Notable quotes

#### 4.2 Scorecard Generation
- [ ] Structured scoring per question category
- [ ] Overall recommendation (Strong Yes to Strong No)
- [ ] Comparison across candidates
- [ ] Export to PDF

#### 4.3 Analytics Dashboard
- [ ] Interview metrics (completion rate, avg duration)
- [ ] Question effectiveness analysis
- [ ] Time-to-hire tracking
- [ ] Trend charts

#### 4.4 Follow-up Generation
- [ ] Real-time follow-up suggestions
- [ ] Context-aware probing questions
- [ ] Clarification prompts

---

## Key Technical Decisions

1. **Multi-tenancy**: Row-level isolation with `companyId` on all tenant data
2. **Auth**: JWT tokens with refresh mechanism
3. **Real-time**: WebSockets for live interview updates
4. **AI**: OpenAI GPT-4o for intelligence, Whisper for STT
5. **Teams**: Microsoft Graph API for scheduling, Bot Framework for in-meeting

---

## Files to Focus On

### Phase 1 Priority Files:
- `src/routes/auth.ts` - Authentication endpoints
- `src/middleware/auth.ts` - JWT middleware
- `src/routes/superAdmin.ts` - Company management
- `src/routes/users.ts` - User management
- `src/routes/admin.ts` - Admin panel routes
- `views/admin/` - EJS templates

### Configuration:
- `prisma/schema.prisma` - Database models
- `src/config/index.ts` - Environment config
- `.env` - Environment variables

---

## Next Steps (Immediate)

1. **Verify voices page matches SellMeACar pattern** - Compare and fix any discrepancies
2. **Complete authentication flow** - Login/logout/session
3. **Test company creation** - Full CRUD
4. **Test user management** - Full CRUD with role assignment
5. **Interview scheduling** - Create, view, update status

---

## Notes

- Admin panel runs on port 8011 by default
- Admin token for testing: `?token=admin`
- Database: SQLite for development, Postgres for production
