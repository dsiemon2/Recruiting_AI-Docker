# AI Recruiting Digital Assistant  
## Twilio, Microsoft Teams, Zoom — Full Session Notes

_Last updated: 2025-12-15_

---

## Session Goal

Design and evaluate how an **AI Digital Assistant for Recruiting** can be:

- Integrated with **Twilio** (already implemented)
- Extended into **Microsoft Teams**
- Extended into **Zoom**
- Designed in a future-proof way to support additional platforms

This document captures the **full reasoning, architecture, trade-offs, and recommendations** from this session.

---

## Integration Levels

### Level 1 — Scheduling & Workflow Automation
- Create meetings
- Send invites
- Reschedule / cancel
- Send reminders
- Trigger post-interview workflows

Supported by **all platforms**.

### Level 2 — In-Meeting AI Assistant
- AI joins meeting
- Captures audio
- Transcribes live
- Generates summaries and scorecards

Highly **platform-dependent**.

---

## Twilio (Current Foundation)

### Strengths
- PSTN voice calls
- SMS / WhatsApp
- IVR and screening flows
- Recording with consent

### Limitations
- No native Zoom or Teams meeting participation
- Telephony-only

### Role
Twilio remains your **voice channel**, not your conferencing solution.

---

## Microsoft Teams

### Why Teams Is Best for AI Interview Bots
- Official support for meeting/calling bots
- Real-time media access
- Enterprise-grade compliance

### Stack
- Teams Calling & Meetings Bots
- Microsoft Graph Cloud Communications
- Real-Time Media Platform

### Use Cases
- AI joins interview
- Transcribes and summarizes
- Generates scorecards

### Pros
- Strongest native support
- Governance and auditability

### Cons
- Engineering complexity
- Azure-centric
- Admin approval required

---

## Zoom

### What Works Well
- Meeting creation
- Webhooks
- Server-to-Server OAuth

### Key Limitation
Zoom Meeting SDK is for **human participants**, not bots.

### Recommendation
- Use Zoom for scheduling and reminders
- Avoid live AI participation unless necessary

---

## Other Platforms

- Google Meet + Calendar
- Cisco Webex
- Slack (workflow + notifications)
- ATS systems (Greenhouse, Lever, Workday, etc.)

---

## Architecture

### Adapter Pattern
- Core Orchestrator
- Twilio Adapter
- Teams Adapter
- Zoom Adapter
- Calendar Adapter
- Workflow/Event Bus

---

## Tech Stack

- Backend: Node.js (NestJS/Fastify) or .NET 8
- Workflow: Temporal or n8n
- Data: Postgres + Redis
- Events: Service Bus / SQS
- AI: Tool-calling LLM
- Security: Secrets Manager + Audit Logs

---

## Product Strategy

### Tiered Capabilities

**Tier 1**
- Scheduling, reminders, ATS updates

**Tier 2**
- Transcript ingestion, summaries

**Tier 3**
- Live AI assistant (Teams-first)

---

## Final Recommendation

- Build scheduling + workflows first
- Implement Teams live assistant next
- Treat Zoom live bots as high-risk
- Design for extensibility

---

_End of session_
