# CRM Integration Strategy for Recruiting AI

## Executive Summary

This document outlines the recommended CRM integrations for the Recruiting AI platform. After analyzing 12+ CRM solutions, we recommend a **tiered integration approach** supporting multiple CRMs to maximize market reach.

---

## Top CRM Recommendations (Ranked)

### Tier 1: Must-Have Integrations

| CRM | Priority | Market Share | Best For | API Quality |
|-----|----------|--------------|----------|-------------|
| **Salesforce Sales Cloud** | #1 | 23% (Enterprise leader) | Large enterprises, staffing agencies | Excellent |
| **HubSpot CRM** | #2 | 15% (Growing fast) | SMB, mid-market, startups | Excellent |
| **Microsoft Dynamics 365** | #3 | 12% (Enterprise) | MS ecosystem users, Teams integration | Excellent |

### Tier 2: High-Value Integrations

| CRM | Priority | Best For | Notes |
|-----|----------|----------|-------|
| **Zoho CRM** | #4 | Mid-market, AI-first companies | Built-in AI (Zia), affordable |
| **Pipedrive** | #5 | Sales-focused recruiting firms | Visual pipeline, simple API |

### Tier 3: Niche/Future Integrations

| CRM | Use Case |
|-----|----------|
| Copper | Google Workspace-heavy companies |
| Close | Inside sales/high-volume recruiting |
| Keap | Automation-focused agencies |
| Nutshell | Small recruiting teams |

---

## Detailed Analysis

### 1. Salesforce Sales Cloud (HIGHEST PRIORITY)

**Why #1 for Recruiting AI:**
- Industry standard for staffing/recruiting agencies
- Massive ecosystem with recruiting-specific apps (Bullhorn, JobScience)
- Enterprise clients expect Salesforce integration
- Robust REST & SOAP APIs

**Integration Approach:**
```
Recruiting AI <-> Salesforce Connected App <-> Sales Cloud
```

**Key Sync Points:**
| Recruiting AI | Salesforce Object |
|---------------|-------------------|
| Candidate | Contact / Lead |
| Interview | Task / Event |
| Job Role | Opportunity |
| Company | Account |
| Interview Result | Custom Object |
| Scorecard | Custom Object |

**API Details:**
- Auth: OAuth 2.0 (JWT Bearer or Web Server Flow)
- Endpoints: REST API, Bulk API 2.0 for large syncs
- Rate Limits: 100,000 calls/24hr (Enterprise)
- Webhooks: Platform Events, Change Data Capture

**Sample Integration Code:**
```typescript
// src/integrations/salesforce/client.ts
import jsforce from 'jsforce';

export class SalesforceClient {
  private conn: jsforce.Connection;

  async connect() {
    this.conn = new jsforce.Connection({
      loginUrl: process.env.SF_LOGIN_URL,
      clientId: process.env.SF_CLIENT_ID,
      clientSecret: process.env.SF_CLIENT_SECRET,
    });
    await this.conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
  }

  async syncCandidate(candidate: Candidate) {
    return this.conn.sobject('Contact').upsert({
      Email: candidate.email,
      FirstName: candidate.firstName,
      LastName: candidate.lastName,
      RecordTypeId: 'Candidate_RT_ID',
      Interview_Score__c: candidate.overallScore,
      Recommendation__c: candidate.recommendation,
    }, 'Email');
  }

  async createInterviewTask(interview: Interview) {
    return this.conn.sobject('Task').create({
      WhoId: interview.candidateSfId,
      Subject: `AI Interview: ${interview.jobRole}`,
      Status: interview.status,
      Description: interview.summary,
      ActivityDate: interview.scheduledAt,
    });
  }
}
```

**Estimated Effort:** 3-4 weeks

---

### 2. HubSpot CRM (HIGH PRIORITY)

**Why #2 for Recruiting AI:**
- Free tier attracts SMBs (your initial market)
- Excellent developer experience
- Growing rapidly in recruiting space
- Strong automation (Workflows)

**Integration Approach:**
```
Recruiting AI <-> HubSpot Private App <-> HubSpot CRM
```

**Key Sync Points:**
| Recruiting AI | HubSpot Object |
|---------------|----------------|
| Candidate | Contact |
| Interview | Engagement (Meeting) |
| Job Role | Deal |
| Company | Company |
| Interview Result | Custom Object |

**API Details:**
- Auth: Private App Token or OAuth 2.0
- Endpoints: REST API v3
- Rate Limits: 100 calls/10sec, 250,000/day
- Webhooks: Native webhook subscriptions

**Sample Integration Code:**
```typescript
// src/integrations/hubspot/client.ts
import { Client } from '@hubspot/api-client';

export class HubSpotClient {
  private client: Client;

  constructor() {
    this.client = new Client({ accessToken: process.env.HUBSPOT_TOKEN });
  }

  async syncCandidate(candidate: Candidate) {
    const properties = {
      email: candidate.email,
      firstname: candidate.firstName,
      lastname: candidate.lastName,
      interview_score: candidate.overallScore?.toString(),
      recommendation: candidate.recommendation,
      interview_summary: candidate.summary,
    };

    // Upsert by email
    try {
      const existing = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: candidate.email }]
        }],
        limit: 1,
      });

      if (existing.results.length > 0) {
        return this.client.crm.contacts.basicApi.update(existing.results[0].id, { properties });
      }
    } catch (e) {}

    return this.client.crm.contacts.basicApi.create({ properties });
  }

  async logInterview(interview: Interview, contactId: string) {
    return this.client.crm.objects.meetings.basicApi.create({
      properties: {
        hs_meeting_title: `AI Interview: ${interview.jobRole}`,
        hs_meeting_body: interview.summary,
        hs_meeting_outcome: interview.recommendation,
        hs_meeting_start_time: interview.startedAt?.toISOString(),
        hs_meeting_end_time: interview.completedAt?.toISOString(),
      },
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 200 }]
      }]
    });
  }
}
```

**Estimated Effort:** 2-3 weeks

---

### 3. Microsoft Dynamics 365 (HIGH PRIORITY)

**Why Include Dynamics:**
- Enterprise standard (especially in industries like healthcare, finance)
- Native integration with Microsoft ecosystem (Teams, Outlook, LinkedIn)
- Many large recruiting agencies use Dynamics
- LinkedIn Recruiter integration potential

**Integration Approach:**
```
Recruiting AI <-> Azure AD App <-> Dynamics 365 Web API
```

**Key Sync Points:**
| Recruiting AI | Dynamics Entity |
|---------------|-----------------|
| Candidate | Contact |
| Interview | Appointment / Task |
| Job Role | Opportunity |
| Company | Account |
| Scorecard | Custom Entity |

**API Details:**
- Auth: OAuth 2.0 via Azure AD
- Endpoints: Web API (OData v4)
- Rate Limits: 6000 requests/5 min (per user)
- Webhooks: Azure Service Bus, Webhooks

**Sample Integration Code:**
```typescript
// src/integrations/dynamics/client.ts
import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';

export class DynamicsClient {
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DYNAMICS_URL; // e.g., https://org.crm.dynamics.com
  }

  async authenticate() {
    const msalConfig = {
      auth: {
        clientId: process.env.DYNAMICS_CLIENT_ID,
        clientSecret: process.env.DYNAMICS_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.DYNAMICS_TENANT_ID}`,
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);
    const result = await cca.acquireTokenByClientCredential({
      scopes: [`${this.baseUrl}/.default`],
    });
    this.accessToken = result.accessToken;
  }

  async syncCandidate(candidate: Candidate) {
    const endpoint = `${this.baseUrl}/api/data/v9.2/contacts`;

    // Check if exists
    const searchUrl = `${endpoint}?$filter=emailaddress1 eq '${candidate.email}'`;
    const existing = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    const data = {
      emailaddress1: candidate.email,
      firstname: candidate.firstName,
      lastname: candidate.lastName,
      new_interviewscore: candidate.overallScore,
      new_recommendation: candidate.recommendation,
      description: candidate.summary,
    };

    if (existing.data.value.length > 0) {
      const contactId = existing.data.value[0].contactid;
      return axios.patch(`${endpoint}(${contactId})`, data, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    }

    return axios.post(endpoint, data, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  }
}
```

**Estimated Effort:** 3-4 weeks

---

### 4. Zoho CRM (MEDIUM PRIORITY)

**Why Include Zoho:**
- Built-in AI assistant (Zia) aligns with AI-first approach
- Popular in mid-market
- Affordable (great for price-sensitive customers)
- Good automation features

**API Details:**
- Auth: OAuth 2.0
- Endpoints: REST API v2
- Rate Limits: 500-25000 calls/day (varies by plan)
- Webhooks: Native support

**Sample Integration Code:**
```typescript
// src/integrations/zoho/client.ts
import axios from 'axios';

export class ZohoClient {
  private accessToken: string;
  private apiDomain: string;

  async refreshToken() {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }
    });
    this.accessToken = response.data.access_token;
    this.apiDomain = response.data.api_domain;
  }

  async syncCandidate(candidate: Candidate) {
    const data = {
      data: [{
        Email: candidate.email,
        First_Name: candidate.firstName,
        Last_Name: candidate.lastName,
        Interview_Score: candidate.overallScore,
        Recommendation: candidate.recommendation,
      }],
      duplicate_check_fields: ['Email'],
    };

    return axios.post(`${this.apiDomain}/crm/v2/Contacts/upsert`, data, {
      headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}` }
    });
  }
}
```

**Estimated Effort:** 2 weeks

---

### 5. Pipedrive (MEDIUM PRIORITY)

**Why Include Pipedrive:**
- Visual pipeline perfect for recruiting workflows
- Simple, clean API
- Popular with sales-focused recruiting firms
- Easy setup (fastest to integrate)

**API Details:**
- Auth: API Token or OAuth 2.0
- Endpoints: REST API v1
- Rate Limits: 100 requests/10sec
- Webhooks: Native support

**Sample Integration Code:**
```typescript
// src/integrations/pipedrive/client.ts
import Pipedrive from 'pipedrive';

export class PipedriveClient {
  private client: Pipedrive.ApiClient;

  constructor() {
    this.client = new Pipedrive.ApiClient();
    this.client.authentications.api_key.apiKey = process.env.PIPEDRIVE_API_KEY;
  }

  async syncCandidate(candidate: Candidate) {
    const personsApi = new Pipedrive.PersonsApi(this.client);

    // Search for existing
    const search = await personsApi.searchPersons({ term: candidate.email });

    const personData = {
      name: `${candidate.firstName} ${candidate.lastName}`,
      email: [{ value: candidate.email, primary: true }],
      // Custom fields
      [process.env.PIPEDRIVE_SCORE_FIELD]: candidate.overallScore,
      [process.env.PIPEDRIVE_REC_FIELD]: candidate.recommendation,
    };

    if (search.data?.items?.length > 0) {
      return personsApi.updatePerson(search.data.items[0].item.id, personData);
    }

    return personsApi.addPerson(personData);
  }
}
```

**Estimated Effort:** 1-2 weeks

---

## Recommended Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      RECRUITING AI                               │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Interviews  │    │  Candidates  │    │   Results    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                    │
│                   ┌─────────▼─────────┐                         │
│                   │   CRM Sync Queue   │                         │
│                   │   (Bull/Redis)     │                         │
│                   └─────────┬─────────┘                         │
│                             │                                    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Salesforce │    │   HubSpot   │    │  Dynamics   │
    │   Adapter   │    │   Adapter   │    │   Adapter   │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │ Salesforce  │    │   HubSpot   │    │  Dynamics   │
    │  Sales Cloud│    │     CRM     │    │     365     │
    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create CRM integration base architecture
- [ ] Implement sync queue with Bull/Redis
- [ ] Design unified data mapping schema
- [ ] Build admin UI for CRM configuration

### Phase 2: Salesforce Integration (Week 3-6)
- [ ] Salesforce Connected App setup
- [ ] OAuth 2.0 implementation
- [ ] Candidate/Contact sync
- [ ] Interview/Task sync
- [ ] Custom objects for scorecards
- [ ] Webhook listeners

### Phase 3: HubSpot Integration (Week 7-9)
- [ ] HubSpot Private App setup
- [ ] Contact sync with custom properties
- [ ] Meeting/Engagement logging
- [ ] Deal pipeline integration
- [ ] Workflow triggers

### Phase 4: Microsoft Dynamics (Week 10-13)
- [ ] Azure AD App registration
- [ ] Web API integration
- [ ] Contact/Appointment sync
- [ ] Custom entity for results
- [ ] Teams meeting integration

### Phase 5: Additional CRMs (Week 14+)
- [ ] Zoho CRM
- [ ] Pipedrive
- [ ] Others based on customer demand

---

## Data Mapping Standard

All CRM integrations should map to this standard schema:

```typescript
interface CRMCandidate {
  // Core Fields (Required)
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;

  // Recruiting AI Fields
  interviewScore?: number;        // 1-5
  recommendation?: string;        // STRONG_YES, YES, MAYBE, NO, STRONG_NO
  interviewSummary?: string;      // AI-generated summary
  interviewDate?: Date;
  jobRole?: string;
  strengths?: string[];
  weaknesses?: string[];

  // Sync Metadata
  recruitingAiId: string;         // Our internal ID
  crmId?: string;                 // CRM's ID
  lastSyncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'error';
}

interface CRMInterview {
  candidateId: string;
  jobRole: string;
  scheduledAt: Date;
  completedAt?: Date;
  duration?: number;              // minutes
  mode: 'ai_only' | 'hybrid';
  transcript?: string;
  summary?: string;
  scorecard?: object;
  recommendation?: string;
}
```

---

## Configuration UI

Add CRM settings page at `/admin/crm-settings`:

```
┌─────────────────────────────────────────────────────────────┐
│  CRM Integration Settings                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Salesforce]  [HubSpot]  [Dynamics]  [Zoho]  [Pipedrive]  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Salesforce Sales Cloud                              │   │
│  │                                                       │   │
│  │  Status: ● Connected                                 │   │
│  │                                                       │   │
│  │  Client ID: ___________________________________      │   │
│  │  Client Secret: ________________________________     │   │
│  │  Login URL: [Production ▼]                          │   │
│  │                                                       │   │
│  │  Sync Options:                                       │   │
│  │  ☑ Sync candidates as Contacts                      │   │
│  │  ☑ Log interviews as Tasks                          │   │
│  │  ☑ Create Opportunities for job roles               │   │
│  │  ☐ Bi-directional sync (pull from CRM)              │   │
│  │                                                       │   │
│  │  [Test Connection]  [Save]  [Disconnect]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Sync History                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Today 2:30 PM  │ 15 candidates synced              │   │
│  │  Today 1:00 PM  │ 8 interviews logged               │   │
│  │  Yesterday      │ 42 candidates synced              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

1. **Token Storage**: Store OAuth tokens encrypted in database
2. **Refresh Tokens**: Implement automatic token refresh
3. **Scopes**: Request minimum necessary permissions
4. **Audit Logging**: Log all CRM sync operations
5. **Data Privacy**: Respect candidate consent preferences
6. **Rate Limiting**: Implement backoff strategies

---

## Conclusion

**Immediate Priority (Phase 1-3):**
1. Salesforce - Enterprise market leader
2. HubSpot - SMB market leader
3. Microsoft Dynamics - Enterprise + MS ecosystem

**Secondary Priority (Phase 4+):**
4. Zoho CRM - Mid-market with AI features
5. Pipedrive - Simple, visual, fast integration

This tiered approach ensures we capture:
- **50%+ of enterprise market** (Salesforce + Dynamics)
- **60%+ of SMB market** (HubSpot + Zoho + Pipedrive)

---

## NPM Packages Required

```json
{
  "dependencies": {
    "jsforce": "^2.0.0",
    "@hubspot/api-client": "^11.0.0",
    "@azure/msal-node": "^2.6.0",
    "pipedrive": "^20.0.0",
    "bull": "^4.12.0",
    "ioredis": "^5.3.0"
  }
}
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Author: Recruiting AI Development Team*
