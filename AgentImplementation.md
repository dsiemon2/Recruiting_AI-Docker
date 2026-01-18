# Agent Implementation - Recruiting AI

## Project Overview

**Type**: Training & Education Platform
**Purpose**: AI-powered structured interview platform for recruitment via MS Teams

## Tech Stack

```
Backend:     Node.js + Express + TypeScript
Database:    SQLite + Prisma ORM
Voice:       OpenAI Realtime API
Real-time:   WebSockets
Integration: Microsoft Teams
Frontend:    EJS templates + Bootstrap 5 + Bootstrap Icons
Container:   Docker + Docker Compose
Port:        8085
Base Path:   /RecruitingAI/
```

## Key Components

- `src/middleware/rbac.ts` - Role-based access control
- `src/routes/` - Admin and interview routes
- `prisma/schema.prisma` - Interview/candidate schema

## RBAC Roles (5 tiers)
- SUPER_ADMIN
- COMPANY_ADMIN
- MANAGER
- SUPERVISOR
- CANDIDATE

## Subscription Tiers
- Free Trial
- Non-Profit
- Professional
- Premium

---

## Recommended Agents

### MUST IMPLEMENT (Priority 1)

| Agent | File | Use Case |
|-------|------|----------|
| **Backend Architect** | engineering/backend-architect.md | Interview session management, MS Teams integration |
| **DevOps Automator** | engineering/devops-automator.md | Docker management, deployment |
| **AI Engineer** | engineering/ai-engineer.md | OpenAI integration, interview question generation |
| **Database Admin** | data/database-admin.md | SQLite, interview schema, candidate data |
| **Security Auditor** | security/security-auditor.md | Multi-tenant security, candidate PII, RBAC |
| **Bug Debugger** | quality/bug-debugger.md | Interview session issues, WebSocket debugging |

### SHOULD IMPLEMENT (Priority 2)

| Agent | File | Use Case |
|-------|------|----------|
| **Frontend Developer** | engineering/frontend-developer.md | Interview UI, candidate portal |
| **API Tester** | testing/api-tester.md | Interview API validation |
| **Code Reviewer** | quality/code-reviewer.md | TypeScript patterns, RBAC implementation |
| **UI Designer** | design/ui-designer.md | Interview interface, dashboard |
| **UX Researcher** | design/ux-researcher.md | Candidate experience, interviewer workflow |
| **Content Creator** | marketing/content-creator.md | Question bank content, job descriptions |

### COULD IMPLEMENT (Priority 3)

| Agent | File | Use Case |
|-------|------|----------|
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Interview analytics, hiring metrics |
| **Feedback Synthesizer** | product/feedback-synthesizer.md | Candidate/interviewer feedback |
| **Workflow Optimizer** | testing/workflow-optimizer.md | Interview scheduling optimization |

---

## Agent Prompts Tailored for This Project

### Backend Architect Prompt Addition
```
Project Context:
- AI-powered structured interview platform
- Microsoft Teams integration for video interviews
- 5-tier RBAC system (SUPER_ADMIN to CANDIDATE)
- Real-time WebSocket interview sessions
- Job role and question bank configuration
- Subscription-based pricing model
```

### AI Engineer Prompt Addition
```
Project Context:
- OpenAI for interview question generation
- Real-time transcription and analysis
- Structured interview scoring
- Candidate response evaluation
- WebSocket for live interview interaction
```

### Security Auditor Prompt Addition
```
Project Context:
- Multi-company tenant isolation
- Candidate PII protection (resume, contact info)
- 5-tier RBAC with hierarchical permissions
- Session security for interviews
- MS Teams OAuth integration
```

---

## Marketing & Growth Agents (When Production Ready)

Add these when the project is ready for public release/marketing:

### Social Media & Marketing

| Agent | File | Use Case |
|-------|------|----------|
| **TikTok Strategist** | marketing/tiktok-strategist.md | HR tips, interview prep content, recruiting trends |
| **Instagram Curator** | marketing/instagram-curator.md | Company culture shots, success stories |
| **Twitter/X Engager** | marketing/twitter-engager.md | HR community, recruiting thought leadership |
| **Reddit Community Builder** | marketing/reddit-community-builder.md | r/recruiting, r/humanresources, r/interviews |
| **Content Creator** | marketing/content-creator.md | Question banks, interview guides, blog content |
| **SEO Optimizer** | marketing/seo-optimizer.md | HR software keywords, interview platform SEO |
| **Visual Storyteller** | design/visual-storyteller.md | Product screenshots, workflow diagrams |

### Growth & Analytics

| Agent | File | Use Case |
|-------|------|----------|
| **Growth Hacker** | marketing/growth-hacker.md | B2B lead generation, free trial conversion |
| **Trend Researcher** | product/trend-researcher.md | HR tech trends, recruiting industry updates |
| **Finance Tracker** | studio-operations/finance-tracker.md | Subscription revenue, per-company metrics |
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Interview completion rates, platform usage |

---

## Not Recommended for This Project

| Agent | Reason |
|-------|--------|
| Mobile App Builder | Web-based + Teams integration |
| Whimsy Injector | Professional recruitment context |

---

## Implementation Commands

```bash
# Invoke agents from project root
claude --agent engineering/backend-architect
claude --agent engineering/ai-engineer
claude --agent data/database-admin
claude --agent security/security-auditor
claude --agent quality/code-reviewer
claude --agent quality/bug-debugger
```
