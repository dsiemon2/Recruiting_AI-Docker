# Single-Tenant vs Multi-Tenant Architecture

## Overview

This document explains the difference between single-tenant and multi-tenant architecture, and analyzes how Recruiting AI implements multi-tenancy.

---

## Single-Tenant Architecture

**Definition**: Each customer gets their own dedicated application instance, database, and infrastructure.

**Analogy**: Like having your own private house.

```
Customer A ──→ [App Instance A] ──→ [Database A]
Customer B ──→ [App Instance B] ──→ [Database B]
Customer C ──→ [App Instance C] ──→ [Database C]
```

### Pros
- Complete data isolation
- Full customization per customer
- No "noisy neighbor" issues
- Easier compliance (HIPAA, SOC2)

### Cons
- Higher infrastructure costs
- Harder to maintain (N instances)
- Slower feature rollouts
- More DevOps overhead

### Use Cases
- Enterprise customers with strict security requirements
- Healthcare (HIPAA compliance)
- Government contracts
- Customers needing heavy customization

---

## Multi-Tenant Architecture

**Definition**: One shared application instance serves all customers, with data logically separated.

**Analogy**: Like an apartment building - shared structure, private units.

```
Customer A ─┐
Customer B ─┼──→ [Shared App] ──→ [Shared Database]
Customer C ─┘                      (data separated by tenant_id)
```

### Pros
- Cost-efficient (shared resources)
- Easier maintenance (one codebase)
- Faster feature rollouts
- Better scalability
- Lower operational overhead

### Cons
- Shared resources (potential performance impact)
- Less customization flexibility
- "Noisy neighbor" risk
- More complex security model

### Use Cases
- SaaS products
- B2B applications
- Platforms with many small-medium customers
- Products requiring rapid iteration

---

## Multi-Tenant Isolation Strategies

### 1. Database-per-Tenant
```
Tenant A ──→ [App] ──→ [Database A]
Tenant B ──→ [App] ──→ [Database B]
```
- Strongest isolation
- Higher cost
- Used by: Enterprise SaaS

### 2. Schema-per-Tenant
```
Tenant A ──→ [App] ──→ [DB: Schema A]
Tenant B ──→ [App] ──→ [DB: Schema B]
```
- Good isolation
- Moderate cost
- Used by: Mid-market SaaS

### 3. Row-Level Isolation (Discriminator Column)
```
Tenant A ──→ [App] ──→ [DB: WHERE tenant_id = 'A']
Tenant B ──→ [App] ──→ [DB: WHERE tenant_id = 'B']
```
- Shared tables with `tenant_id` column
- Most cost-efficient
- Used by: Most SaaS products

---

## Recruiting AI: Multi-Tenant Analysis

### Architecture Type
**Multi-Tenant with Row-Level Isolation**

Recruiting AI uses `companyId` as the tenant discriminator across all tenant-scoped tables.

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLATFORM LEVEL                             │
│                                                                 │
│  SuperAdmin (manages all companies/tenants)                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      TENANT LEVEL (Companies)                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Acme Corp  │  │  TechStart   │  │  BigRetail   │          │
│  │   (Tenant A) │  │  (Tenant B)  │  │  (Tenant C)  │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ • Users      │  │ • Users      │  │ • Users      │          │
│  │ • Job Roles  │  │ • Job Roles  │  │ • Job Roles  │          │
│  │ • Questions  │  │ • Questions  │  │ • Questions  │          │
│  │ • Interviews │  │ • Interviews │  │ • Interviews │          │
│  │ • Results    │  │ • Results    │  │ • Results    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tenant-Scoped Models

| Model | Tenant Key | Description |
|-------|-----------|-------------|
| `Company` | `id` (root) | The tenant entity itself |
| `User` | `companyId` | Users belong to one company |
| `JobRole` | `companyId` | Job roles scoped to company |
| `QuestionCategory` | `companyId` | Question categories per company |
| `Interview` | `companyId` | Interviews scoped to company |
| `AuditLog` | `companyId` | Audit trails per company |
| `Payment` | `companyId` | Billing records per company |

### Shared (Platform-Level) Models

These models are **NOT** tenant-scoped and shared across all companies:

| Model | Purpose |
|-------|---------|
| `SuperAdmin` | Platform administrators |
| `AppConfig` | Global application settings |
| `AIAgent` | Shared AI agent configurations |
| `AITool` | Shared AI tool definitions |
| `Webhook` | Integration webhooks |
| `SMSSettings` | SMS provider settings |
| `CallTransfer` | Call transfer configurations |
| `DTMFMenu` | Phone menu configurations |
| `LogicRule` | Business logic rules |
| `Function` | Custom function definitions |
| `Language` | Available languages |

### Tenant Isolation Features

#### 1. Unique Domain per Tenant
```prisma
model Company {
  domain String @unique  // acme.recruiting-ai.com
}
```

#### 2. Composite Unique Constraints
```prisma
model User {
  @@unique([email, companyId])     // Same email OK in different companies
  @@unique([username, companyId])  // Same username OK in different companies
}
```

#### 3. Cascading Deletes
```prisma
model User {
  company Company @relation(..., onDelete: Cascade)
}
```
When a company is deleted, all related data is automatically removed.

#### 4. Indexed Tenant Columns
```prisma
model Interview {
  @@index([companyId])  // Fast tenant-filtered queries
}
```

### Data Flow Example

```
HTTP Request
    │
    ▼
┌─────────────────┐
│ Auth Middleware │ ──→ Extract companyId from JWT/session
└─────────────────┘
    │
    ▼
┌─────────────────┐
│    Controller   │ ──→ req.companyId available
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Prisma Query   │ ──→ WHERE companyId = req.companyId
└─────────────────┘
    │
    ▼
┌─────────────────┐
│    Database     │ ──→ Only tenant's data returned
└─────────────────┘
```

---

## Comparison: Retell.AI vs Recruiting AI

| Aspect | Retell.AI | Recruiting AI |
|--------|-----------|---------------|
| Architecture | Multi-Tenant | Multi-Tenant |
| Tenant Identifier | API Key / Account ID | `companyId` |
| Isolation Strategy | API key scoping | Row-level (discriminator) |
| Data Isolation | Per API key | Per Company |
| Shared Resources | AI infrastructure, models | AI Agents, Languages, Settings |
| User Model | Account → API Keys → Calls | Company → Users → Interviews |
| Billing Model | Per-minute usage | Per company subscription |

---

## Best Practices for Multi-Tenant Applications

### 1. Always Filter by Tenant
```typescript
// GOOD
const interviews = await prisma.interview.findMany({
  where: { companyId: req.companyId }
});

// BAD - Security vulnerability!
const interviews = await prisma.interview.findMany();
```

### 2. Use Middleware for Tenant Context
```typescript
app.use((req, res, next) => {
  req.companyId = extractCompanyFromToken(req);
  next();
});
```

### 3. Validate Tenant on Updates/Deletes
```typescript
// Verify the record belongs to the tenant before modifying
const interview = await prisma.interview.findFirst({
  where: { id: interviewId, companyId: req.companyId }
});
if (!interview) throw new ForbiddenError();
```

### 4. Index Tenant Columns
```prisma
model Interview {
  @@index([companyId])
  @@index([companyId, status])  // Compound index for common queries
}
```

### 5. Use Row-Level Security (RLS) if Available
PostgreSQL example:
```sql
CREATE POLICY tenant_isolation ON interviews
  USING (company_id = current_setting('app.current_tenant'));
```

---

## Conclusion

Recruiting AI implements a **multi-tenant architecture with row-level isolation**, using `companyId` as the tenant discriminator. This approach provides:

- **Cost efficiency** through shared infrastructure
- **Data isolation** through consistent tenant filtering
- **Scalability** as new tenants share the same codebase
- **Flexibility** with platform-level shared configurations

The architecture is similar to most modern SaaS platforms like Retell.AI, Slack, and Salesforce.
