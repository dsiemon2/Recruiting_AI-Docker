# AI Recruiting Digital Assistant: Twilio + Microsoft Teams + Zoom Integration Guide

_Last updated: 2025-12-15_

## Purpose

You already have a recruiting-focused AI assistant working with **Twilio**. This document explains how to extend it into:

- **Microsoft Teams** (meetings + “join as a bot” options)
- **Zoom** (meeting management + what is and is not feasible for “bot joins meeting”)
- Additional recommended integrations (Google Meet/Calendar, Webex, Slack, ATS)

It includes a recommended tech stack, architecture, implementation phases, and platform-specific pros/cons.

---

## Key Takeaway (Reality Check)

There are two different “levels” of conferencing integration:

### Level 1 — Scheduling + Reminders + Workflow Automation (Universal, Low Risk)
- Create meetings, send invites, reschedule/cancel, reminders, post-interview follow-ups
- Works well across Teams, Zoom, Google Meet (via Calendar), Webex

### Level 2 — In-Meeting AI Assistant (Joins meeting, captures audio, transcribes live)
- **Teams**: Most viable path using Teams calling/meeting bots and Microsoft Graph cloud communications.
- **Zoom**: Zoom’s **Meeting SDK is reserved for human use cases and does not support bots or AI notetakers** (per Zoom docs). This makes “bot participant” implementations materially harder and policy-sensitive.

References:
- Teams calls/meetings bots overview: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/calls-meetings-bots-overview
- Teams real-time media concepts: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/real-time-media-concepts
- Microsoft Graph cloud communications get started: https://learn.microsoft.com/en-us/graph/cloud-communications-get-started
- Zoom Meeting SDK (note about bots): https://developers.zoom.us/docs/meeting-sdk/

---

## Recommended Architecture

### 1) Provider Adapter Pattern (Avoid Lock-In)

Build a **provider-agnostic orchestration core**, and isolate each provider behind an adapter:

- **Orchestrator API**
  - candidate context, requisitions, interview stages
  - LLM orchestration + tool calling
  - policies + audit logs

- **Telephony Adapter (Twilio)**
  - voice webhooks (TwiML), call flows, recordings (if enabled)
  - SMS/WhatsApp reminders

- **Conferencing Adapter (Teams / Zoom / others)**
  - create/update/cancel meetings
  - webhook/event subscription handling
  - (optional) join meeting as assistant (Teams-first)

- **Calendar Adapter**
  - Microsoft 365 Calendar (Graph) and/or Google Calendar
  - availability/constraints, time zones, invite templates

- **Event Bus / Workflow**
  - durable events: InterviewScheduled → ReminderSent → InterviewCompleted → ScorecardGenerated

### 2) Compliance Layer (Recruiting Context)

If you plan transcription/recording, implement:
- explicit consent tracking per tenant/policy
- retention windows by asset type (audio, transcripts, summaries)
- redaction pipelines (SSN, address, etc.)
- immutable audit logs (who accessed candidate content)

---

## Microsoft Teams Integration

### What You Can Do

#### A) Scheduling (Level 1)
- Create online meetings and invites using Microsoft Graph.
- Manage updates/cancellations.
Reference:
- Graph Teams/meeting ecosystem overview: https://learn.microsoft.com/en-us/graph/api/resources/teams-api-overview?view=graph-rest-1.0

#### B) Join Calls/Meetings as a Bot (Level 2, Teams is the strongest option)
Microsoft supports **calls and meetings bots** that can interact with real-time voice/video and call control using Graph APIs.
References:
- Teams calls/meetings bots overview: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/calls-meetings-bots-overview
- Register a calling bot: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/registering-calling-bot
- Graph cloud communications “get started”: https://learn.microsoft.com/en-us/graph/cloud-communications-get-started
- Real-time media platform concepts: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/real-time-media-concepts

### Implementation Outline (Teams)

1. **Create/register a Teams bot**
   - Set up an app in Teams developer portal / Bot Framework
   - Enable Teams channel
2. **Grant Graph permissions**
   - Cloud communications permissions, admin consent in tenant
3. **Host bot services**
   - Commonly Azure; note some media bot requirements are Windows Server in Azure for production for application-hosted media bots:
     - https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots
4. **Add meeting creation and invite logic**
   - Graph API creates meeting; your assistant sends invite via email/Teams
5. **(Optional) Real-time media pipeline**
   - Stream audio to STT → LLM → TTS
   - Apply redaction and consent rules
6. **Emit workflow events**
   - InterviewStarted, CandidateJoined, InterviewEnded → generate summary + scorecard

### Pros / Cons (Teams)

**Pros**
- Best-supported “in-meeting bot assistant” story among major platforms
- Strong enterprise governance / tenant admin controls
- Good fit for regulated recruiting environments

**Cons**
- Engineering complexity (app registration, Graph permissions, real-time media)
- Tenant admin approval is typically required
- Testing/certification can add friction

---

## Zoom Integration

### What You Can Do Well (Level 1)

- Create/update/cancel meetings with Zoom APIs
- Subscribe to event notifications (webhooks) depending on app type/scopes
- Use Server-to-Server OAuth for account-level integrations (internal apps)

References:
- Zoom API docs: https://developers.zoom.us/docs/api/
- Server-to-Server OAuth: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
- Create S2S OAuth app: https://developers.zoom.us/docs/internal-apps/create/

### The Hard Constraint (Level 2)

Zoom states the **Meeting SDK is reserved for human use cases and does not support bots or AI notetakers**:
- https://developers.zoom.us/docs/meeting-sdk/

Additionally, Zoom developer forum discussions commonly note there is **no public API that directly “joins” a meeting**; joining typically relies on client/SDK implementations:
- https://devforum.zoom.us/t/how-do-note-taking-bots-join-zoom-meetings/76040

### Practical Recommendation for Zoom

- Offer **Zoom scheduling + reminders + post-meeting workflow** as your default.
- If you must support “bot joins Zoom meeting,” treat it as an advanced, separate track with heightened policy/legal review.

### Pros / Cons (Zoom)

**Pros**
- Strong meeting management APIs and auth options
- S2S OAuth works well for managed enterprise Zoom accounts

**Cons**
- “In-meeting AI assistant” is constrained by Zoom’s SDK positioning on bots/notetakers
- Higher risk of policy friction and breakage vs. Teams approach

---

## Additional Integrations to Consider

### 1) Google Meet + Google Calendar (High ROI)
- Use Google Calendar as the scheduling control plane; Meet links are calendar-driven.
- Great for availability checks and invite workflows.
- Meeting participation as a bot is not as straightforward as Teams.

### 2) Cisco Webex (Enterprise)
- Mature APIs for meetings and messaging; common in regulated industries.

### 3) Slack (Recruiter Operations)
- Not a meeting platform in the same way, but excellent for:
  - hiring manager notifications
  - approvals (“approve offer package”)
  - interview debrief workflows

### 4) ATS / HRIS (Critical for Recruiting Products)
Recommended targets:
- Greenhouse, Lever, Workday, iCIMS, SmartRecruiters
Value:
- candidate stage updates
- interview kits/scorecards
- structured feedback capture

---

## Recommended Tech Stack

### Backend (Webhook + Integration Heavy)
- **TypeScript / Node.js** with NestJS or Fastify
  - Strong for webhook-driven integrations (Twilio/Teams/Zoom)
- Alternative: **.NET 8** (excellent if you want tight Azure integration, Graph SDKs, and enterprise controls)

### Workflow Engine
- **Temporal** (durable, code-first orchestration; best for complex recruiting pipelines)
- **n8n** (fast iteration; good for “connectors” and operational automations)

### Data + Infra
- Postgres (system of record)
- Redis (short-lived session state, rate-limits, dedupe)
- Queue/event bus: Azure Service Bus / AWS SQS / Kafka (as scale demands)
- Secrets: Azure Key Vault / AWS Secrets Manager
- Observability: OpenTelemetry + centralized logging/APM

### AI Layer
- LLM tool-calling pattern:
  - tools: scheduleInterview, sendReminder, createTeamsMeeting, createZoomMeeting, updateCandidateStage, etc.
- STT/TTS (only where you have consent and platform feasibility):
  - streaming STT for calls (Twilio voice media stream patterns if you implement it)
  - Teams real-time media for in-meeting audio (Teams-first)

---

## Implementation Roadmap

### Phase 1 (2–4 weeks): Multi-provider scheduling + reminders
- Teams meeting create/update/cancel
- Zoom meeting create/update/cancel (S2S OAuth if enterprise/internal)
- Calendar integration (M365 and/or Google)
- Notifications (email/SMS/Slack/Teams chat)

### Phase 2: Teams in-meeting assistant (selective tenants)
- Teams calling/meeting bot
- consent prompts + recording/transcription policy
- transcript → summary → structured scorecard

### Phase 3: Zoom in-meeting assistant (only if required)
- Treat as a special project with policy + technical constraints
- Pilot with a single tenant and controlled environments

---

## Decision Criteria (What to Build First)

If your priority is a reliable “AI assistant that can join interviews”:
- **Teams-first** is the pragmatic route.

If your priority is “works everywhere quickly”:
- Deliver **scheduling + reminders + follow-ups** for Zoom/Teams/Meet/Webex first.
- Add in-meeting features only where the platform story is strong and enterprise customers will approve it.

---

## Suggested Next Technical Deliverable

If you want, I can generate a follow-on **implementation skeleton** in a repo-friendly structure (folders, interfaces, adapter stubs, webhook handlers) for:
- `twilio-adapter`
- `teams-adapter`
- `zoom-adapter`
- `calendar-adapter`
- `workflow` (Temporal or n8n)
- `llm-tools`

