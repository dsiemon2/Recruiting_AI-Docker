# Recruiting AI

AI-powered recruiting assistant with MS Teams integration.

**Production Domain:** www.recruitabilityai.com

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express 4.19
- **Language:** TypeScript 5.6
- **Database:** SQLite
- **ORM:** Prisma 5.19
- **WebSockets:** ws 8.18.0

### Frontend
- **Templating:** EJS 3.1
- **CSS Framework:** Bootstrap 5
- **Icons:** Bootstrap Icons

### Payment Gateways
Stripe, Braintree, Square, Authorize.net

### SMS/Notifications
- **Twilio** - SMS notifications for interview reminders

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx Proxy | 8085 | Main entry point |
| App Server | 3000 | Internal - Main application |
| Admin Server | 3001 | Internal - Admin panel |

## Local Development URLs

- **Landing Page:** http://localhost:8085/RecruitingAI/
- **Admin Panel:** http://localhost:8085/RecruitingAI/admin?token=admin

## Docker Setup

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Author

Daniel Siemon
