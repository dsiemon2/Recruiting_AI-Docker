# Admin Guide - AI Recruiting Assistant

## Accessing the Admin Panel

1. Start the admin server: `npm run dev:admin`
2. Open: `http://localhost:8051/admin?token=YOUR_TOKEN`
3. The token is set in your `.env` file as `ADMIN_TOKEN`

---

## Dashboard

The dashboard provides an at-a-glance overview:

### Statistics
- **Total Interviews**: All interviews conducted
- **Scheduled**: Upcoming interviews
- **Completed**: Finished interviews
- **Job Roles**: Active positions

### Upcoming Interviews
Shows the next 10 scheduled interviews with:
- Candidate name
- Job role
- Scheduled date/time
- Quick actions

---

## Interview Setup

### Interviews

Manage all candidate interviews:

- **View All**: List of interviews with status filtering
- **New Interview**: Schedule a new interview
  - Candidate details (name, email, phone)
  - Job role selection
  - Interview mode (AI Only or Hybrid)
  - Duration and notes

**Interview Statuses:**
- `SCHEDULED` - Upcoming interview
- `IN_PROGRESS` - Currently happening
- `COMPLETED` - Finished with results
- `CANCELLED` - Cancelled by admin
- `NO_SHOW` - Candidate didn't attend

### Job Roles

Configure positions you're hiring for:

- **Create Role**: Add new job titles
- **Categories**: Group questions (Technical, Behavioral, Culture Fit)
- **Questions**: Assign questions to each category

### Questions

Manage your interview question bank:

#### Viewing Questions
Questions are organized by Job Role > Category > Question with:
- Question text
- Follow-up questions
- Time allocation
- Required flag

#### Adding Questions
Click "Add Question" to create individual questions with:
- Job role and category assignment
- Question text
- Follow-up questions (one per line)
- Time allocation (minutes)
- Required/optional flag
- Evaluation criteria

#### Importing Questions

**Excel Import** (.xlsx, .xls) - Recommended:
1. Click Import > Import from Excel
2. Select job role and category
3. Upload your Excel file
4. Preview detected questions
5. Click Import

Column names (flexible - case insensitive):
| Column | Alternatives |
|--------|-------------|
| Question | Text, Q, Question_Text |
| Followups | Follow_ups, Follow-ups |
| Time_Minutes | Time, Minutes, Duration |
| Required | Is_Required, Mandatory |
| Evaluation_Criteria | Criteria, Evaluation, Scoring |

**CSV Import**:
Same columns as Excel, comma-separated

**Word Import** (.docx):
- Numbered items become questions (1. Question text)
- Bullet points become questions (- Question text)
- Indented sub-items become follow-ups

#### Download Templates
- Download Excel Template - Pre-formatted .xlsx with sample data
- Download CSV Template - Simple .csv format

---

## AI Configuration

### AI Config

Global AI settings:

- **Default Model**: GPT-4o Realtime, GPT-4o, GPT-4 Turbo
- **Temperature**: Creativity level (0.0-2.0)
- **Max Tokens**: Response length limit
- **Voice Settings**: Default voice, speech speed, TTS toggle
- **Safety**: Content filtering, PII detection, transcript logging

### AI Agents

Create AI interviewer personas:

| Agent | Purpose |
|-------|---------|
| Interview Screener | Initial candidate screening |
| Technical Assessor | Technical skills evaluation |
| Interview Scheduler | Scheduling assistance |

Each agent has:
- Name and description
- System prompt (personality/instructions)
- Model selection
- Voice selection
- Temperature setting

### AI Tools

Define tools the AI can use during interviews:

**Tool Types:**
- `function` - Internal function call
- `api` - External API request
- `webhook` - Webhook trigger

**Example Tools:**
- `schedule_followup` - Schedule follow-up interview
- `lookup_candidate` - Get candidate info
- `send_notification` - Send email/SMS

Each tool requires a JSON schema defining parameters.

### Voices

Select AI voice for interviews:

| Voice | Gender | Description |
|-------|--------|-------------|
| Alloy | Neutral | Balanced, professional |
| Echo | Male | Clear, authoritative |
| Fable | Male | British accent |
| Onyx | Male | Deep, confident |
| Nova | Female | Warm, friendly |
| Shimmer | Female | Soft, approachable |

**Customization:**
- Speaking rate (0.5x - 2.0x)
- Pitch adjustment

### Languages

Enable/disable supported languages:

| Language | Code | Status |
|----------|------|--------|
| English (US) | en-US | Active |
| English (UK) | en-GB | Active |
| Spanish | es-ES | Active |
| French | fr-FR | Inactive |
| German | de-DE | Inactive |
| Portuguese | pt-BR | Inactive |
| Chinese | zh-CN | Inactive |
| Japanese | ja-JP | Inactive |

Each language shows Voice/STT/TTS support status.

---

## Automation

### Logic Rules

Create automated workflows triggered by events:

**Trigger Events:**
- `interview.created` - New interview scheduled
- `interview.started` - Interview begins
- `interview.completed` - Interview finished
- `score.generated` - Scoring complete
- `candidate.no_show` - Candidate missed interview
- `score.below_threshold` - Low score detected

**Example Rules:**

| Rule | Trigger | Action |
|------|---------|--------|
| Low Score Alert | score.generated | Email HR if score < 3 |
| No Show Follow-up | candidate.no_show | Send reschedule email + SMS |
| Fast Track | interview.completed | Auto-advance if score >= 4 |

**Configuration:**
- Conditions (JSON array)
- Actions (JSON array)
- Priority (higher = runs first)

### Functions

Custom JavaScript functions for advanced automation:

**Example Functions:**
```javascript
// Calculate weighted interview score
function calculateWeightedScore(scores, weights) {
  let total = 0, weightSum = 0;
  for (const category in scores) {
    if (weights[category]) {
      total += scores[category] * weights[category];
      weightSum += weights[category];
    }
  }
  return weightSum > 0 ? total / weightSum : 0;
}
```

Each function defines:
- Name and description
- Parameters (JSON)
- Return type
- JavaScript code

---

## Communication

### SMS Settings

Configure SMS notifications:

**Provider Options:**
- Twilio
- Vonage (Nexmo)
- MessageBird
- Plivo

**Settings:**
- Account credentials
- From number
- Reminder timing (hours before interview)
- Message template with variables: `{name}`, `{date}`, `{time}`, `{role}`, `{company}`

### Call Transfer

Set up transfer to human agents:

**Transfer Targets:**
| Name | Phone | Priority |
|------|-------|----------|
| HR Department | +1555... | 10 |
| Lead Recruiter | +1555... | 20 |
| Emergency Support | +1555... | 5 |

Higher priority = tried first. Can include SIP URIs for VoIP.

### DTMF Menu

Configure phone keypad options during calls:

| Key | Action | Prompt |
|-----|--------|--------|
| 1 | Repeat | "Press 1 to hear the question again" |
| 2 | Skip | "Press 2 to skip to next question" |
| 0 | Transfer | "Press 0 to speak with a representative" |
| * | Pause | "Press star to pause the interview" |
| # | End | "Press pound to end the interview" |

### Webhooks

Send events to external systems:

**Example Webhooks:**
- Slack Notifications - Interview completed, scores generated
- ATS Integration - Sync with applicant tracking system

**Configuration:**
- Webhook URL
- Events to send
- Secret key for verification

**Available Events:**
- `interview.created`
- `interview.started`
- `interview.completed`
- `candidate.no_show`
- `score.generated`
- `transcript.ready`

---

## Company Management

### Users

Manage users within your company:

**Roles:**
- `COMPANY_ADMIN` - Full access
- `MANAGER` - Interview management

**User Fields:**
- Name, email, password
- Role assignment
- Active/inactive status

### Companies

(Super Admin only) Manage multiple companies:

- Create new companies
- View company statistics
- Manage company settings

---

## Billing

### Payments

View billing and transactions:

**Dashboard:**
- Total Revenue
- Transaction Count
- Pending Payments
- Failed Payments

**Transaction Details:**
- Date and transaction ID
- Amount and currency
- Payment method (Card, Bank, PayPal)
- Status (Completed, Pending, Failed, Refunded)

---

## Settings

Global application settings:

- **Default Voice**: AI voice for new interviews
- **Max Interview Duration**: Time limit in minutes
- **Transcription**: Enable/disable recording
- **Auto Summary**: AI-generated summaries
- **Email Notifications**: Reminder settings

---

## Best Practices

### Question Bank Management
1. Organize questions by category (Technical, Behavioral, Culture Fit)
2. Use follow-up questions to dig deeper
3. Set appropriate time allocations
4. Mark critical questions as required
5. Include evaluation criteria for scoring guidance

### AI Agent Configuration
1. Create specific agents for different interview types
2. Use clear, detailed system prompts
3. Test agents before production use
4. Adjust temperature based on desired creativity

### Automation Rules
1. Start with simple rules (notifications)
2. Test rules with sample data
3. Set appropriate priorities to control execution order
4. Monitor rule execution in logs

### Integration Setup
1. Configure webhooks for ATS integration
2. Set up SMS reminders (24h before)
3. Enable call transfer for complex situations
4. Test DTMF menu options
