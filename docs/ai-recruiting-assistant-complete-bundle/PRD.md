# Product Requirements Document (PRD)
# AI Recruiting Digital Assistant

_Last updated: 2025-12-15_

---

## Vision

An AI-powered recruiting assistant that conducts structured interviews via Microsoft Teams, helping companies standardize their hiring process, reduce interviewer bias, and generate objective candidate evaluations.

---

## Target Users

### Primary Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Company Admin** | Sets up company account, manages users, configures interview templates | Full control over platform settings, user management, billing |
| **Hiring Manager** | Conducts interviews with AI assistance, reviews results | Easy interview flow, quality candidate insights, time savings |
| **Recruiter** | Schedules interviews, tracks candidates through pipeline | Scheduling automation, candidate status visibility |

### Secondary Users

| Role | Description |
|------|-------------|
| **Candidate** | Joins Teams interview, answers questions from AI and/or manager |
| **Super Admin** | Platform operator who creates company accounts (internal) |

---

## Account & Multi-Tenancy Model

### Company-Based Accounts

```
Platform
├── Company A (Acme Corp)
│   ├── Admin: john@acme.com
│   ├── Manager: sarah@acme.com
│   ├── Manager: mike@acme.com
│   ├── Job Roles: [Software Engineer, Product Manager, ...]
│   └── Question Banks: [Technical, Behavioral, ...]
│
├── Company B (TechStart Inc)
│   ├── Admin: ceo@techstart.com
│   └── ...
```

### Account Creation (MVP)

- **Sales-led / Admin-created**: Super admin creates company accounts manually
- Companies provide: name, domain, primary admin email
- Future: Self-service signup with domain verification

### Data Isolation

- Each company's data is fully isolated
- Questions, interviews, candidates, and results are company-scoped
- No cross-company data access

---

## Roles & Permissions

### Role Hierarchy

| Permission | Super Admin | Company Admin | Manager |
|------------|:-----------:|:-------------:|:-------:|
| Create company accounts | Yes | - | - |
| Manage company settings | - | Yes | - |
| Manage billing | - | Yes | - |
| Add/remove users | - | Yes | - |
| Create/edit job roles | - | Yes | - |
| Create/edit question banks | - | Yes | - |
| Assign questions to roles | - | Yes | - |
| Conduct interviews | - | Yes | Yes |
| View all company interviews | - | Yes | - |
| View own interviews | - | Yes | Yes |
| View interview scorecards | - | Yes | Yes |

### Role Definitions

**Company Admin**
- Full control over company configuration
- Manages users, job roles, question templates
- Can conduct interviews
- Views all company interview data
- Manages billing and integrations

**Manager (Interviewer)**
- Conducts interviews (AI-only or hybrid mode)
- Views interviews they participated in
- Cannot modify questions or settings
- Can add interview notes

---

## Interview Question Management

### Question Organization

Questions are organized in a two-level hierarchy:

```
Job Role: "Software Engineer"
├── Category: "Technical"
│   ├── Q1: "Explain how you would design a REST API for..."
│   ├── Q2: "What's the difference between SQL and NoSQL?"
│   └── Q3: "Describe your debugging process..."
│
├── Category: "Behavioral"
│   ├── Q1: "Tell me about a time you disagreed with a teammate..."
│   └── Q2: "Describe a project you're most proud of..."
│
└── Category: "Culture Fit"
    ├── Q1: "Why are you interested in this company?"
    └── Q2: "What's your ideal work environment?"
```

### Question Attributes

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The main question text |
| `category` | enum | Technical, Behavioral, Culture Fit, Role-Specific |
| `followUps` | string[] | Suggested follow-up questions for AI |
| `evaluationCriteria` | string | What to look for in a good answer |
| `timeAllocation` | number | Suggested minutes for this question |
| `isRequired` | boolean | Must be asked in every interview |
| `order` | number | Display/asking order within category |

### Question Bank Features

- **Import/Export**: Upload questions via CSV/Excel
- **Templates**: Pre-built question sets for common roles
- **Versioning**: Track changes to questions over time
- **Analytics**: See which questions correlate with successful hires

---

## Interview Modes

### Mode 1: AI-Only Interview

The AI conducts the entire interview autonomously.

**Flow:**
1. Candidate joins Teams meeting
2. AI introduces itself and explains the process
3. AI asks questions from the configured template
4. AI generates follow-ups based on candidate responses
5. AI thanks candidate and ends interview
6. System generates transcript, summary, and scorecard

**Use Cases:**
- Initial screening interviews
- High-volume hiring
- After-hours interviews (async)

### Mode 2: Hybrid Interview (Manager + AI)

Manager leads the interview with AI assistance.

**Flow:**
1. Manager and candidate join Teams meeting
2. Manager introduces themselves and the AI assistant
3. Manager conducts interview with AI support:
   - Manager asks their own questions anytime
   - Manager clicks "Next AI Question" to have AI ask from the queue
   - AI displays suggested follow-ups (manager can approve/skip)
   - AI takes notes in real-time
4. Manager ends interview
5. System generates transcript, summary, and scorecard

**Manager Controls:**
- **Question Queue**: See upcoming AI questions, reorder or skip
- **Trigger AI**: Button to have AI ask next question
- **Follow-up Suggestions**: AI suggests follow-ups, manager approves with one click
- **Pause AI**: Temporarily disable AI suggestions
- **Add Notes**: Real-time note-taking alongside AI notes

**AI Assistance Features:**
- Real-time transcription displayed to manager
- Suggested follow-up questions based on candidate answers
- Time tracking per question/section
- Coverage indicator (which required questions remain)

---

## Microsoft Teams Integration

### Why Teams Only (No Zoom)

- Teams has official support for calling/meeting bots
- Real-time media access for transcription
- Enterprise-grade compliance and governance
- Better fit for regulated recruiting environments

### Integration Capabilities

**Level 1: Scheduling & Workflow (MVP)**
- Create Teams meetings via Microsoft Graph API
- Send calendar invites to managers and candidates
- Automated reminders (email, Teams chat)
- Meeting lifecycle webhooks

**Level 2: In-Meeting AI Assistant (Phase 2)**
- AI joins meeting as a bot participant
- Real-time audio capture and transcription
- AI asks questions via text-to-speech
- Live follow-up suggestions to manager

### Technical Requirements

- Microsoft 365 tenant with admin approval
- Teams bot registration in Azure
- Microsoft Graph API permissions
- Azure hosting (recommended for Teams alignment)

---

## Core Features (MVP)

### 1. Company & User Management

- [ ] Super admin dashboard to create companies
- [ ] Company admin dashboard for user management
- [ ] Role assignment (Admin, Manager)
- [ ] Email invitations for new users

### 2. Job Role Management

- [ ] Create/edit/archive job roles
- [ ] Assign question categories to roles
- [ ] Set required vs optional questions
- [ ] Configure time allocations

### 3. Question Bank

- [ ] CRUD for questions
- [ ] Organize by category
- [ ] Add follow-up suggestions
- [ ] Bulk import via CSV
- [ ] Question templates library

### 4. Interview Scheduling

- [ ] Create interview sessions
- [ ] Select job role (loads question template)
- [ ] Choose interview mode (AI-only or Hybrid)
- [ ] Assign manager(s) for hybrid mode
- [ ] Generate Teams meeting link
- [ ] Send invites to participants

### 5. Interview Execution (Phase 2)

- [ ] Teams bot joins meeting
- [ ] Real-time transcription
- [ ] AI asks questions (AI-only mode)
- [ ] Manager controls (Hybrid mode)
- [ ] Follow-up suggestions

### 6. Post-Interview

- [ ] Auto-generated transcript
- [ ] AI-generated summary
- [ ] Structured scorecard
- [ ] Manager can add notes
- [ ] Export to ATS (future)

---

## Data Model (Conceptual)

```
Company
├── id, name, domain, settings
│
├── Users[]
│   └── id, email, name, role, companyId
│
├── JobRoles[]
│   └── id, title, description, companyId
│
├── QuestionCategories[]
│   └── id, name, jobRoleId
│
├── Questions[]
│   └── id, text, categoryId, followUps, criteria, isRequired, order
│
├── Interviews[]
│   └── id, candidateName, candidateEmail, jobRoleId, mode, status, scheduledAt
│
├── InterviewSessions[]
│   └── id, interviewId, managerId, teamsMeetingUrl, startedAt, endedAt
│
└── InterviewResults[]
    └── id, interviewId, transcript, summary, scorecard, managerNotes
```

---

## Non-Goals (Out of Scope for MVP)

- Zoom integration (Teams only)
- Self-service company signup
- ATS integrations (Greenhouse, Lever, etc.)
- Video recording/playback
- Multi-language support
- Mobile app
- Candidate self-scheduling portal

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to schedule interview | < 2 minutes |
| Interview completion rate | > 95% |
| Manager satisfaction (NPS) | > 50 |
| Scorecard generation time | < 5 minutes post-interview |
| Question coverage in interviews | > 90% of required questions |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Teams bot approval delays | High | Start tenant approval process early, document requirements |
| AI transcription accuracy | Medium | Use high-quality STT, allow manual corrections |
| Manager adoption resistance | Medium | Emphasize AI as assistant, not replacement |
| Data privacy concerns | High | Clear consent flows, retention policies, audit logs |

---

## Implementation Phases

### Phase 1: Foundation (Current)
- Company/user management
- Job role and question bank CRUD
- Basic interview scheduling (manual Teams link)

### Phase 2: Teams Integration
- Microsoft Graph integration for meeting creation
- Calendar invites and reminders
- Webhook handling for meeting events

### Phase 3: In-Meeting AI
- Teams calling/meeting bot
- Real-time transcription
- AI question asking (AI-only mode)
- Manager controls (Hybrid mode)

### Phase 4: Intelligence
- AI-generated summaries and scorecards
- Follow-up question suggestions
- Interview analytics dashboard
