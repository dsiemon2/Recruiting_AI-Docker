# AI Recruiting Assistant - DevOps Guide

_Last Updated: 2025-12-17_

---

## Table of Contents

1. [Development Environment](#development-environment)
2. [Build & Test](#build--test)
3. [Deployment Environments](#deployment-environments)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Infrastructure](#infrastructure)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security](#security)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling](#scaling)

---

## Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package manager |
| Git | 2.x | Version control |
| VS Code | Latest | IDE (recommended) |
| Docker | 24.x | Containerization (optional) |

### Local Setup

```bash
# Clone repository
git clone https://github.com/yourorg/recruiting-ai.git
cd recruiting-ai

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Initialize database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Required
NODE_ENV=development
PORT=8050
DATABASE_URL=file:./dev.db
JWT_SECRET=dev-secret-change-in-production
ADMIN_TOKEN=admin
OPENAI_API_KEY=sk-...

# Microsoft Teams (optional for dev)
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# OAuth (Stage 5)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
```

### VS Code Extensions

```json
{
  "recommendations": [
    "prisma.prisma",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Build & Test

### NPM Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

### Build Process

```bash
# TypeScript compilation
npm run build

# Output structure
dist/
├── server.js
├── routes/
├── services/
├── middleware/
└── utils/
```

### Testing Strategy

| Test Type | Tool | Location | Coverage Target |
|-----------|------|----------|-----------------|
| Unit | Jest | `tests/unit/` | 80% |
| Integration | Jest + Supertest | `tests/integration/` | 60% |
| E2E | Playwright | `tests/e2e/` | Critical paths |

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Deployment Environments

### Environment Matrix

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| Local | Development | SQLite | localhost:8050 |
| Dev | Feature testing | PostgreSQL | dev.recruit-ai.com |
| Staging | Pre-production | PostgreSQL | staging.recruit-ai.com |
| Production | Live | PostgreSQL | app.recruit-ai.com |

### Environment Configuration

#### Development
```env
NODE_ENV=development
DATABASE_URL=file:./dev.db
LOG_LEVEL=debug
```

#### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/recruiting
LOG_LEVEL=info
```

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/recruiting
LOG_LEVEL=warn
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      # Deploy to staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      # Deploy to production
```

### Deployment Methods

#### Option 1: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 8050
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8050:8050"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/recruiting
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=recruiting

volumes:
  postgres_data:
```

#### Option 2: Platform-as-a-Service

**Railway**
```bash
# Install CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

**Render**
```yaml
# render.yaml
services:
  - type: web
    name: recruiting-ai
    env: node
    buildCommand: npm install && npm run build && npx prisma generate
    startCommand: npx prisma migrate deploy && node dist/server.js
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: recruiting-db
          property: connectionString

databases:
  - name: recruiting-db
    databaseName: recruiting
    plan: starter
```

#### Option 3: VPS (DigitalOcean/AWS EC2)

```bash
# Setup script
#!/bin/bash

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/yourorg/recruiting-ai.git
cd recruiting-ai
npm install
npm run build

# Start with PM2
pm2 start dist/server.js --name recruiting-ai
pm2 startup
pm2 save

# Setup Nginx
sudo apt-get install nginx
# Configure reverse proxy
```

---

## Infrastructure

### Architecture Options

#### Small Scale (< 1000 users)

```
┌─────────────────────────────────────────────────────┐
│                    Single VPS                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Nginx     │  │   Node.js   │  │  PostgreSQL │ │
│  │   (proxy)   │→ │   (app)     │→ │   (db)      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Cost**: ~$20-50/month

#### Medium Scale (1000-10000 users)

```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                      │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   App 1     │ │   App 2     │ │   App 3     │
│   (Node.js) │ │   (Node.js) │ │   (Node.js) │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       ▼
            ┌─────────────────────┐
            │  PostgreSQL (RDS)   │
            │  + Read Replicas    │
            └─────────────────────┘
                       │
            ┌─────────────────────┐
            │       Redis         │
            │    (Sessions/Cache) │
            └─────────────────────┘
```

**Cost**: ~$200-500/month

#### Large Scale (10000+ users)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare)                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    Application Load Balancer                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  EKS Cluster  │    │  EKS Cluster  │    │  EKS Cluster  │
│  (us-east-1)  │    │  (eu-west-1)  │    │  (ap-south-1) │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                ┌─────────────────────┐
                │   Aurora Global     │
                │   (Multi-region)    │
                └─────────────────────┘
                             │
                ┌─────────────────────┐
                │   ElastiCache       │
                │   (Redis Cluster)   │
                └─────────────────────┘
```

**Cost**: ~$2000+/month

### Required AWS Services (Medium Scale)

| Service | Purpose | Est. Cost/mo |
|---------|---------|--------------|
| EC2 (t3.medium x2) | App servers | $60 |
| RDS (db.t3.small) | PostgreSQL | $30 |
| ElastiCache (t3.micro) | Redis | $15 |
| ALB | Load balancer | $20 |
| S3 | File storage | $5 |
| CloudWatch | Monitoring | $10 |
| **Total** | | **~$140** |

---

## Monitoring & Observability

### Logging

#### Pino Logger Configuration

```typescript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
  } : undefined,
  redact: ['req.headers.authorization', 'password'],
});
```

#### Log Aggregation Options

| Tool | Type | Cost |
|------|------|------|
| CloudWatch Logs | AWS native | Pay per GB |
| Datadog | SaaS | $15/host/mo |
| Grafana Loki | Self-hosted | Free |
| Papertrail | SaaS | $7/mo |

### Metrics

#### Key Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Response Time (p99) | API latency | > 500ms |
| Error Rate | 5xx responses | > 1% |
| WebSocket Connections | Active interviews | > 80% capacity |
| CPU Usage | Server load | > 80% |
| Memory Usage | RAM consumption | > 85% |
| DB Connections | Connection pool | > 90% |

#### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'recruiting-ai'
    static_configs:
      - targets: ['app:9090']
    metrics_path: '/metrics'
```

### Health Checks

```typescript
// src/routes/health.ts
router.get('/healthz', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    openai: await checkOpenAI(),
  };

  const healthy = Object.values(checks).every(c => c.status === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});
```

### Alerting

```yaml
# Example PagerDuty/Opsgenie alert rules
alerts:
  - name: HighErrorRate
    condition: error_rate > 0.01
    severity: critical
    channels: [slack, pagerduty]

  - name: SlowAPI
    condition: p99_latency > 1000ms
    severity: warning
    channels: [slack]

  - name: DatabaseDown
    condition: db_health != ok
    severity: critical
    channels: [slack, pagerduty, email]
```

---

## Security

### Security Checklist

#### Application Security
- [ ] JWT tokens with short expiry (1h access, 7d refresh)
- [ ] Password hashing (bcrypt, cost 12)
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (EJS auto-escaping)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet.js security headers

#### Infrastructure Security
- [ ] HTTPS everywhere (TLS 1.3)
- [ ] Secrets in environment variables (never in code)
- [ ] Database encryption at rest
- [ ] VPC with private subnets
- [ ] Security groups (minimal ports)
- [ ] WAF rules (OWASP Top 10)

#### Compliance
- [ ] GDPR data handling
- [ ] SOC 2 audit trail
- [ ] Recording consent mechanism
- [ ] Data retention policies
- [ ] Right to deletion

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "api.openai.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests' },
});

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: { error: 'Too many login attempts' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

---

## Backup & Recovery

### Database Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full | Daily | 30 days | S3 Glacier |
| Incremental | Hourly | 7 days | S3 Standard |
| WAL Archive | Continuous | 7 days | S3 Standard |

### Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="recruiting_${DATE}.sql.gz"

# Create backup
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE s3://recruiting-backups/daily/

# Cleanup
rm /tmp/$BACKUP_FILE

# Notify
curl -X POST $SLACK_WEBHOOK -d "{\"text\": \"Backup completed: $BACKUP_FILE\"}"
```

### Recovery Procedures

#### Database Recovery
```bash
# Download backup
aws s3 cp s3://recruiting-backups/daily/recruiting_20251217.sql.gz .

# Restore
gunzip -c recruiting_20251217.sql.gz | psql $DATABASE_URL
```

#### Full System Recovery
1. Provision new infrastructure (Terraform)
2. Restore database from backup
3. Deploy application
4. Update DNS
5. Verify functionality
6. Notify stakeholders

---

## Scaling

### Horizontal Scaling

#### Application Tier
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recruiting-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: recruiting-ai
  template:
    spec:
      containers:
        - name: app
          image: recruiting-ai:latest
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "500m"
              memory: "1Gi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recruiting-ai-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recruiting-ai
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### WebSocket Scaling Considerations

WebSocket connections require sticky sessions or a pub/sub layer:

```typescript
// Using Redis for WebSocket scaling
import { createClient } from 'redis';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Database Scaling

| Strategy | When to Use | Complexity |
|----------|-------------|------------|
| Connection Pooling | Always | Low |
| Read Replicas | High read load | Medium |
| Vertical Scaling | Quick fix | Low |
| Sharding | Very large datasets | High |

---

## Runbook

### Common Issues

#### High Memory Usage
```bash
# Check memory
free -h

# Find memory hogs
ps aux --sort=-%mem | head

# Restart app (PM2)
pm2 restart recruiting-ai
```

#### Database Connection Issues
```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '1 hour';
```

#### WebSocket Connection Issues
```bash
# Check open connections
netstat -an | grep 8050 | wc -l

# Check application logs
pm2 logs recruiting-ai --lines 100 | grep WebSocket
```

---

_End of DevOps Guide_
