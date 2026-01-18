# AI Recruiting Assistant - Jira Epics & Stories

_Last Updated: 2025-12-17_
_Project Key: RECRUIT_

---

## Epic Structure

```
RECRUIT-1   [EPIC] MVP Foundation
RECRUIT-10  [EPIC] Authentication & Security
RECRUIT-20  [EPIC] Core Platform
RECRUIT-30  [EPIC] AI Interview System
RECRUIT-40  [EPIC] Intelligence & Analytics
RECRUIT-50  [EPIC] Enterprise Features
RECRUIT-60  [EPIC] Integrations
```

---

## RECRUIT-1: MVP Foundation

**Status**: DONE
**Sprint**: Sprint 1-2

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-1.1 | Set up Express + TypeScript project | 3 | Done |
| RECRUIT-1.2 | Design and implement Prisma schema | 5 | Done |
| RECRUIT-1.3 | Create admin panel layout with Bootstrap 5 | 3 | Done |
| RECRUIT-1.4 | Implement dashboard with stats | 3 | Done |
| RECRUIT-1.5 | Job Roles CRUD | 5 | Done |
| RECRUIT-1.6 | Questions CRUD with categories | 5 | Done |
| RECRUIT-1.7 | Bulk import (CSV, Excel, Word) | 8 | Done |
| RECRUIT-1.8 | Interview scheduling basic UI | 5 | Done |
| RECRUIT-1.9 | AI configuration pages | 3 | Done |
| RECRUIT-1.10 | Voice selection page | 3 | Done |

**Total Points**: 43

---

## RECRUIT-10: Authentication & Security

**Status**: IN PROGRESS
**Sprint**: Sprint 3-4

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-10.1 | JWT authentication middleware | 5 | Done |
| RECRUIT-10.2 | Login API endpoint | 3 | Done |
| RECRUIT-10.3 | Password hashing with bcrypt | 2 | Done |
| RECRUIT-10.4 | Token refresh mechanism | 3 | Done |
| RECRUIT-10.5 | **Create Account API** | 5 | To Do |
| RECRUIT-10.6 | **Registration UI (frontend)** | 5 | To Do |
| RECRUIT-10.7 | **Email verification flow** | 5 | To Do |
| RECRUIT-10.8 | **Password reset flow** | 5 | To Do |
| RECRUIT-10.9 | **Google OAuth integration** | 8 | To Do |
| RECRUIT-10.10 | **Microsoft OAuth integration** | 8 | To Do |
| RECRUIT-10.11 | **Apple ID OAuth integration** | 8 | To Do |
| RECRUIT-10.12 | **Login with email OR username** | 3 | To Do |
| RECRUIT-10.13 | Basic RBAC middleware | 3 | Done |
| RECRUIT-10.14 | **Fine-grained permissions system** | 8 | To Do |
| RECRUIT-10.15 | **Permission management UI** | 5 | To Do |
| RECRUIT-10.16 | **Custom roles per company** | 5 | To Do |

**Total Points**: 81

### Acceptance Criteria

#### RECRUIT-10.5: Create Account API
```gherkin
Feature: User Registration

Scenario: Register with email/password
  Given I am on the registration page
  When I enter valid email and password
  And I click "Create Account"
  Then a new user account is created
  And a verification email is sent
  And I see "Check your email to verify"

Scenario: Register with existing email
  Given a user exists with email "test@example.com"
  When I try to register with "test@example.com"
  Then I see error "Email already registered"
```

#### RECRUIT-10.9: Google OAuth
```gherkin
Feature: Google Sign-In

Scenario: Sign in with Google
  Given I am on the login page
  When I click "Continue with Google"
  And I authorize in Google popup
  Then I am logged in
  And my profile is populated from Google

Scenario: Link Google to existing account
  Given I have an account with email "me@gmail.com"
  When I sign in with Google using "me@gmail.com"
  Then my Google account is linked
  And I can use either login method
```

---

## RECRUIT-20: Core Platform

**Status**: DONE
**Sprint**: Sprint 2-3

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-20.1 | Multi-tenant middleware | 5 | Done |
| RECRUIT-20.2 | Company CRUD API | 5 | Done |
| RECRUIT-20.3 | Company admin UI | 5 | Done |
| RECRUIT-20.4 | User CRUD API | 5 | Done |
| RECRUIT-20.5 | User management UI | 5 | Done |
| RECRUIT-20.6 | Teams Azure AD app setup | 3 | Done |
| RECRUIT-20.7 | Microsoft Graph client | 5 | Done |
| RECRUIT-20.8 | Teams meeting creation | 5 | Done |
| RECRUIT-20.9 | Teams admin UI | 3 | Done |

**Total Points**: 41

---

## RECRUIT-30: AI Interview System

**Status**: DONE
**Sprint**: Sprint 4-5

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-30.1 | Interview token generation | 3 | Done |
| RECRUIT-30.2 | Candidate interview route & page | 8 | Done |
| RECRUIT-30.3 | Manager dashboard route & page | 8 | Done |
| RECRUIT-30.4 | WebSocket handler for interviews | 8 | Done |
| RECRUIT-30.5 | Audio capture (MediaRecorder API) | 5 | Done |
| RECRUIT-30.6 | Whisper STT client | 5 | Done |
| RECRUIT-30.7 | OpenAI TTS client | 5 | Done |
| RECRUIT-30.8 | Interview engine state machine | 8 | Done |
| RECRUIT-30.9 | Follow-up question generation (GPT-4o) | 5 | Done |
| RECRUIT-30.10 | Real-time transcript storage | 3 | Done |
| RECRUIT-30.11 | Interview completion flow | 3 | Done |
| RECRUIT-30.12 | Error and complete views | 2 | Done |
| RECRUIT-30.13 | Admin interview detail page updates | 3 | Done |
| RECRUIT-30.14 | Generate interview link button | 2 | Done |

**Total Points**: 68

---

## RECRUIT-40: Intelligence & Analytics

**Status**: TO DO
**Sprint**: Sprint 6-7

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-40.1 | Interview summary generation (GPT-4) | 8 | To Do |
| RECRUIT-40.2 | Key points extraction | 5 | To Do |
| RECRUIT-40.3 | Strengths/weaknesses analysis | 5 | To Do |
| RECRUIT-40.4 | Notable quotes extraction | 3 | To Do |
| RECRUIT-40.5 | Scorecard generation | 8 | To Do |
| RECRUIT-40.6 | Scoring rubric configuration | 5 | To Do |
| RECRUIT-40.7 | Candidate comparison view | 8 | To Do |
| RECRUIT-40.8 | PDF export for scorecards | 5 | To Do |
| RECRUIT-40.9 | Analytics dashboard - metrics | 8 | To Do |
| RECRUIT-40.10 | Analytics dashboard - charts | 5 | To Do |
| RECRUIT-40.11 | Question effectiveness analysis | 5 | To Do |
| RECRUIT-40.12 | Time-to-hire tracking | 5 | To Do |
| RECRUIT-40.13 | Real-time follow-up suggestions | 8 | To Do |
| RECRUIT-40.14 | Red flag detection | 5 | To Do |

**Total Points**: 83

---

## RECRUIT-50: Enterprise Features

**Status**: TO DO
**Sprint**: Sprint 8-10

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-50.1 | SAML 2.0 SSO setup | 13 | To Do |
| RECRUIT-50.2 | OIDC provider support | 8 | To Do |
| RECRUIT-50.3 | Directory sync (Azure AD) | 8 | To Do |
| RECRUIT-50.4 | MFA implementation | 8 | To Do |
| RECRUIT-50.5 | Session management policies | 5 | To Do |
| RECRUIT-50.6 | Audit log infrastructure | 8 | To Do |
| RECRUIT-50.7 | Audit log UI | 5 | To Do |
| RECRUIT-50.8 | Data retention policies | 5 | To Do |
| RECRUIT-50.9 | GDPR data export | 5 | To Do |
| RECRUIT-50.10 | GDPR data deletion | 5 | To Do |
| RECRUIT-50.11 | Recording consent management | 5 | To Do |
| RECRUIT-50.12 | Bulk user provisioning | 5 | To Do |
| RECRUIT-50.13 | API key management | 5 | To Do |
| RECRUIT-50.14 | Usage quotas | 5 | To Do |
| RECRUIT-50.15 | Custom branding per company | 8 | To Do |

**Total Points**: 98

---

## RECRUIT-60: Integrations

**Status**: TO DO
**Sprint**: Sprint 10-12

### Stories

| Key | Summary | Points | Status |
|-----|---------|--------|--------|
| RECRUIT-60.1 | Teams bot registration | 5 | To Do |
| RECRUIT-60.2 | Bot Framework SDK setup | 8 | To Do |
| RECRUIT-60.3 | Bot join meeting implementation | 13 | To Do |
| RECRUIT-60.4 | Bot audio capture | 8 | To Do |
| RECRUIT-60.5 | Greenhouse API integration | 8 | To Do |
| RECRUIT-60.6 | Lever API integration | 8 | To Do |
| RECRUIT-60.7 | Generic ATS webhook adapter | 5 | To Do |
| RECRUIT-60.8 | Zoom meeting creation | 5 | To Do |
| RECRUIT-60.9 | Google Calendar integration | 5 | To Do |
| RECRUIT-60.10 | Email notifications (SendGrid) | 5 | To Do |
| RECRUIT-60.11 | SMS reminders (Twilio) | 5 | To Do |
| RECRUIT-60.12 | Slack notifications | 5 | To Do |
| RECRUIT-60.13 | Webhook system - outbound | 8 | To Do |
| RECRUIT-60.14 | Webhook management UI | 5 | To Do |

**Total Points**: 93

---

## Sprint Planning Template

### Sprint N Goals

```markdown
## Sprint N: [Theme]

**Duration**: [Start Date] - [End Date]
**Capacity**: [X] story points

### Committed Stories
| Key | Summary | Points | Assignee |
|-----|---------|--------|----------|
| RECRUIT-X.Y | Story summary | X | @name |

### Sprint Goal
[One sentence describing the main objective]

### Definition of Done
- [ ] Code complete and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing (if applicable)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner acceptance
```

---

## Backlog Prioritization

### Priority 1 (Must Have - MVP)
- RECRUIT-1.* (Foundation) - DONE
- RECRUIT-20.* (Core Platform) - DONE
- RECRUIT-30.* (AI Interview) - DONE
- RECRUIT-10.5-10.8 (Registration/Password Reset)

### Priority 2 (Should Have - Launch)
- RECRUIT-10.9-10.11 (OAuth providers)
- RECRUIT-40.1-40.8 (Summaries & Scorecards)
- RECRUIT-40.9-40.10 (Basic Analytics)

### Priority 3 (Could Have - Growth)
- RECRUIT-10.14-10.16 (Advanced RBAC)
- RECRUIT-40.11-40.14 (Advanced Analytics)
- RECRUIT-60.10-60.12 (Notifications)

### Priority 4 (Won't Have This Release)
- RECRUIT-50.* (Enterprise)
- RECRUIT-60.1-60.4 (Teams Bot)
- RECRUIT-60.5-60.7 (ATS Integrations)

---

## Labels

| Label | Description |
|-------|-------------|
| `auth` | Authentication related |
| `ui` | Frontend/UI work |
| `api` | Backend API work |
| `ai` | AI/ML features |
| `integration` | External integrations |
| `security` | Security related |
| `enterprise` | Enterprise features |
| `bug` | Bug fix |
| `tech-debt` | Technical debt |

---

## Story Point Reference

| Points | Complexity | Time Estimate |
|--------|------------|---------------|
| 1 | Trivial | < 2 hours |
| 2 | Simple | 2-4 hours |
| 3 | Small | Half day |
| 5 | Medium | 1 day |
| 8 | Large | 2-3 days |
| 13 | XL | 1 week |
| 21 | Epic-sized (break down) | > 1 week |

---

_End of Jira Document_
