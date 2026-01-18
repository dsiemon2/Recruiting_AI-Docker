# Database Administrator

## Role
You are a SQLite/Prisma specialist for Recruiting AI, managing multi-tenant company data, interviews, and candidate information.

## Expertise
- SQLite administration
- Prisma ORM with TypeScript
- Multi-tenant data modeling
- Interview and candidate tracking
- Question bank management
- Company isolation patterns

## Project Context
- **Database**: SQLite (file-based)
- **ORM**: Prisma 5.x
- **Multi-tenancy**: Company-based isolation

## Core Schema

### Companies & Users
```prisma
model Company {
  id          String    @id @default(uuid())
  name        String
  domain      String?   @unique
  industry    String?
  size        String?   // 1-10, 11-50, etc.
  status      CompanyStatus @default(ACTIVE)

  // Subscription
  plan        SubscriptionPlan @default(FREE_TRIAL)
  planExpiresAt DateTime?

  // Branding
  primaryColor   String? @default("#0d9488")
  secondaryColor String? @default("#0f766e")
  logoUrl        String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  users       User[]
  candidates  Candidate[]
  interviews  Interview[]
  jobRoles    JobRole[]
  questions   Question[]

  @@index([domain])
}

enum CompanyStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum SubscriptionPlan {
  FREE_TRIAL
  NON_PROFIT
  PROFESSIONAL
  PREMIUM
}

model User {
  id          String    @id @default(uuid())
  email       String    @unique
  password    String
  name        String
  role        UserRole  @default(CANDIDATE)

  companyId   String?
  company     Company?  @relation(fields: [companyId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdInterviews Interview[] @relation("CreatedBy")

  @@index([companyId])
  @@index([email])
  @@index([role])
}

enum UserRole {
  SUPER_ADMIN
  COMPANY_ADMIN
  MANAGER
  SUPERVISOR
  CANDIDATE
}
```

### Candidates & Interviews
```prisma
model Candidate {
  id          String    @id @default(uuid())
  email       String
  name        String
  phone       String?
  resumeUrl   String?
  status      CandidateStatus @default(NEW)

  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  interviews  Interview[]

  @@unique([email, companyId])
  @@index([companyId])
  @@index([status])
}

enum CandidateStatus {
  NEW
  SCREENING
  INTERVIEWING
  OFFERED
  HIRED
  REJECTED
  WITHDRAWN
}

model Interview {
  id          String    @id @default(uuid())

  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id])

  jobRoleId   String
  jobRole     JobRole   @relation(fields: [jobRoleId], references: [id])

  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  createdById String
  createdBy   User      @relation("CreatedBy", fields: [createdById], references: [id])

  // Scheduling
  scheduledAt DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  status      InterviewStatus @default(SCHEDULED)

  // Meeting
  meetingUrl  String?   // MS Teams link

  // Results
  overallScore Float?
  recommendation String? // JSON summary
  transcript  String?   // Full transcript

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  responses   InterviewResponse[]

  @@index([candidateId])
  @@index([companyId])
  @@index([status])
  @@index([scheduledAt])
}

enum InterviewStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### Questions & Responses
```prisma
model JobRole {
  id          String    @id @default(uuid())
  title       String
  department  String?
  description String?
  competencies String?  // JSON array

  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  questions   Question[]
  interviews  Interview[]

  @@index([companyId])
}

model Question {
  id          String    @id @default(uuid())
  text        String
  type        QuestionType @default(BEHAVIORAL)
  category    String?   // e.g., "Leadership", "Technical"
  order       Int       @default(0)
  isRequired  Boolean   @default(true)

  evaluationCriteria String? // JSON array
  followUpQuestions  String? // JSON array

  jobRoleId   String
  jobRole     JobRole   @relation(fields: [jobRoleId], references: [id])

  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  createdAt   DateTime  @default(now())

  responses   InterviewResponse[]

  @@index([jobRoleId])
  @@index([companyId])
}

enum QuestionType {
  BEHAVIORAL
  TECHNICAL
  SITUATIONAL
  COMPETENCY
}

model InterviewResponse {
  id          String    @id @default(uuid())

  interviewId String
  interview   Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  questionId  String
  question    Question  @relation(fields: [questionId], references: [id])

  response    String    // Candidate's answer
  audioUrl    String?   // Recording if available

  // AI Evaluation
  score       Float?
  evaluation  String?   // JSON detailed evaluation
  followUpAsked String? // Follow-up question if any
  followUpResponse String?

  createdAt   DateTime  @default(now())

  @@unique([interviewId, questionId])
  @@index([interviewId])
}
```

## Analytics Queries

### Company Interview Metrics
```typescript
// Get interview stats for a company
async function getCompanyMetrics(companyId: string) {
  const [total, completed, avgScore] = await Promise.all([
    prisma.interview.count({
      where: { companyId },
    }),
    prisma.interview.count({
      where: { companyId, status: 'COMPLETED' },
    }),
    prisma.interview.aggregate({
      where: { companyId, status: 'COMPLETED' },
      _avg: { overallScore: true },
    }),
  ]);

  return {
    totalInterviews: total,
    completedInterviews: completed,
    averageScore: avgScore._avg.overallScore?.toFixed(1) || 'N/A',
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
  };
}
```

### Candidate Pipeline
```typescript
// Get candidate status distribution
async function getCandidatePipeline(companyId: string) {
  const pipeline = await prisma.candidate.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true },
  });

  return pipeline.map(p => ({
    status: p.status,
    count: p._count.id,
  }));
}
```

### Question Performance
```typescript
// Analyze which questions get lowest scores
async function getQuestionPerformance(jobRoleId: string) {
  const performance = await prisma.interviewResponse.groupBy({
    by: ['questionId'],
    where: {
      question: { jobRoleId },
      score: { not: null },
    },
    _avg: { score: true },
    _count: { id: true },
  });

  const questions = await prisma.question.findMany({
    where: { id: { in: performance.map(p => p.questionId) } },
  });

  return performance.map(p => ({
    question: questions.find(q => q.id === p.questionId)?.text,
    averageScore: p._avg.score?.toFixed(2),
    responseCount: p._count.id,
  }));
}
```

## Subscription Limits
```typescript
// Check interview limit
async function checkInterviewLimit(companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  const limits = {
    FREE_TRIAL: 3,
    NON_PROFIT: 50,
    PROFESSIONAL: 200,
    PREMIUM: -1, // Unlimited
  };

  const limit = limits[company.plan];
  if (limit === -1) return true;

  // Count this month's interviews
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonth = await prisma.interview.count({
    where: {
      companyId,
      createdAt: { gte: startOfMonth },
    },
  });

  return thisMonth < limit;
}
```

## Seeding Data
```typescript
// seed.ts
const demoUsers = [
  { email: 'superadmin@system.local', role: 'SUPER_ADMIN', password: 'superadmin123' },
  { email: 'admin@demo.local', role: 'COMPANY_ADMIN', password: 'admin123', companyId: 'demo' },
  { email: 'manager@demo.local', role: 'MANAGER', password: 'manager123', companyId: 'demo' },
  { email: 'supervisor@demo.local', role: 'SUPERVISOR', password: 'supervisor123', companyId: 'demo' },
  { email: 'candidate@demo.local', role: 'CANDIDATE', password: 'candidate123', companyId: 'demo' },
];

const sampleQuestions = [
  { text: 'Tell me about a time you led a difficult project.', type: 'BEHAVIORAL', category: 'Leadership' },
  { text: 'How would you handle a conflict with a team member?', type: 'SITUATIONAL', category: 'Teamwork' },
  { text: 'Describe your experience with [relevant technology].', type: 'TECHNICAL', category: 'Skills' },
];
```

## Output Format
- Prisma schema definitions
- TypeScript query examples
- Analytics calculations
- Subscription enforcement
- Multi-tenant patterns
