# Setup Guide - AI Recruiting Assistant

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key with access to GPT-4o Realtime API

## Installation

### 1. Install Dependencies

```bash
cd Recruiting_AI
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
notepad .env  # Windows
nano .env     # Mac/Linux
```

Required settings:
```env
OPENAI_API_KEY=sk-your-key-here
ADMIN_TOKEN=choose-a-secure-token
PORT=8050
ADMIN_PORT=8051
DATABASE_URL=file:./dev.db
```

### 3. Initialize Database

```bash
# Create database and tables
npx prisma db push

# Seed with sample data (job roles, questions, AI agents, etc.)
npx prisma db seed
```

### 4. Start the Application

**Option A: Development Mode (with auto-reload)**
```bash
# Terminal 1 - Interview server
npm run dev

# Terminal 2 - Admin server
npm run dev:admin
```

**Option B: Production Mode**
```bash
# Build TypeScript
npm run build

# Start servers
npm start
npm run start:admin
```

---

## Accessing the App

- **Interview Voice Interface**: http://localhost:8050
- **Admin Panel**: http://localhost:8051/admin?token=YOUR_TOKEN

---

## First Run Checklist

1. Open the admin panel at http://localhost:8051/admin?token=YOUR_TOKEN
2. **Dashboard**: View overview statistics
3. **Job Roles**: Create positions you're hiring for
4. **Questions**: Add or import interview questions
5. **AI Agents**: Configure AI interviewer personas
6. **AI Config**: Set default model, voice, and safety settings
7. **Voices**: Choose AI voices for interviews
8. **SMS Settings**: Configure interview reminders (optional)
9. Test by creating a sample interview

---

## Setting Up Job Roles

1. Go to **Admin > Job Roles**
2. Click **Add Job Role**
3. Enter:
   - Title (e.g., "Software Engineer")
   - Description
   - Department (optional)
4. Save the role
5. Add **Question Categories**:
   - Technical
   - Behavioral
   - Culture Fit
   - Custom categories

---

## Adding Interview Questions

### Option 1: Manual Entry
1. Go to **Admin > Questions**
2. Click **Add Question**
3. Fill in:
   - Job Role and Category
   - Question text
   - Follow-up questions (one per line)
   - Time allocation (minutes)
   - Required flag
   - Evaluation criteria

### Option 2: Bulk Import from Excel (Recommended)
1. Click **Import > Import from Excel**
2. Select job role and category
3. Upload .xlsx or .xls file with columns:
   - `Question` (or `Text`, `Q`)
   - `Followups` (or `Follow_ups`)
   - `Time_Minutes` (or `Time`, `Duration`)
   - `Required` (or `Is_Required`)
   - `Evaluation_Criteria` (or `Criteria`)
4. Preview and import

### Option 3: Import from CSV
Same columns as Excel, comma-separated format

### Option 4: Import from Word (.docx)
- Numbered items (1. Question text) become questions
- Bullet points (- Question text) become questions
- Indented sub-items become follow-ups

### Download Templates
Click **Import > Download Template** to get pre-formatted Excel or CSV files.

---

## Configuring AI Agents

1. Go to **Admin > AI Agents**
2. Create agents for different interview types:
   - **Interview Screener**: Initial candidate screening
   - **Technical Assessor**: Technical skills evaluation
   - **Interview Scheduler**: Scheduling assistance
3. For each agent, configure:
   - Name and description
   - System prompt (personality/behavior)
   - Model (GPT-4o Realtime, GPT-4o, etc.)
   - Voice (alloy, nova, echo, etc.)
   - Temperature (creativity level)

---

## Scheduling Interviews

1. Go to **Admin > Interviews**
2. Click **New Interview**
3. Enter:
   - Candidate name, email, phone
   - Select job role
   - Choose interview mode:
     - **AI Only**: Fully automated interview
     - **Hybrid**: AI + human interviewer
   - Set duration and notes
4. Save to schedule

---

## Testing the System

### Voice Interview Test
1. Open http://localhost:8050
2. Allow microphone access when prompted
3. Wait for "Connected" status
4. The AI interviewer will greet you
5. Answer questions naturally via voice
6. Test follow-up question handling
7. Complete the interview

### Admin Panel Test
1. Create a test job role
2. Import sample questions
3. Schedule a test interview
4. Verify all data appears correctly
5. Check webhook triggers (if configured)

---

## Common Issues

### "WebSocket connection failed"
- Ensure the interview server is running on port 8050
- Check for firewall blocking WebSocket connections
- Try a different browser (Chrome recommended)

### "Microphone not working"
- Allow microphone permissions in browser
- Check system microphone settings
- Ensure no other app is using the microphone

### "OpenAI API error"
- Verify your API key in `.env`
- Ensure API key has access to GPT-4o Realtime API
- Check you have sufficient API credits

### "Database error"
- Run `npx prisma db push` to sync schema
- Run `npx prisma db seed` for sample data

### "Admin panel shows Unauthorized"
- Check the `token` query parameter matches `ADMIN_TOKEN` in `.env`

### "Import failed"
- Ensure file format matches expected columns
- Check file size is under 10MB
- Verify file encoding (UTF-8 recommended)

---

## Database Management

```bash
# View database in browser
npx prisma studio

# Reset database (deletes all data!)
rm prisma/dev.db        # Mac/Linux
del prisma\dev.db       # Windows
npx prisma db push
npx prisma db seed

# Run migrations (if schema changed)
npx prisma migrate dev
```

---

## Integration Setup

### Webhooks
1. Go to **Admin > Webhooks**
2. Add webhook URL (e.g., Slack, ATS system)
3. Select events to trigger:
   - `interview.created`
   - `interview.completed`
   - `score.generated`
4. Set secret key for verification

### SMS Reminders
1. Go to **Admin > SMS Settings**
2. Select provider (Twilio, Vonage, etc.)
3. Enter credentials
4. Set reminder timing (hours before interview)
5. Customize message template

### Call Transfer
1. Go to **Admin > Call Transfer**
2. Add transfer targets with phone numbers
3. Set priority (higher = tried first)
4. Enable transfer option in AI config

---

## Security Notes

- Change `ADMIN_TOKEN` to something secure and unique
- Don't expose admin port publicly without proper authentication
- API keys should never be committed to git
- Enable PII detection for sensitive data handling
- Configure content filtering as needed

---

## Logs

Server logs are output to console using Pino logger. For production:
```bash
npm run dev 2>&1 | tee app.log
```

---

## Updating

```bash
git pull
npm install
npx prisma db push
npm run build
```

---

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
OPENAI_API_KEY=sk-...
ADMIN_TOKEN=secure-random-string
DATABASE_URL=file:./prod.db
PORT=8050
ADMIN_PORT=8051
```

### Process Management
Use PM2 or similar for production:
```bash
npm install -g pm2
pm2 start dist/server.js --name "interview-server"
pm2 start dist/adminServer.js --name "admin-server"
pm2 save
pm2 startup
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name interviews.yourdomain.com;

    location / {
        proxy_pass http://localhost:8050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:8051;
        proxy_set_header Host $host;
    }
}
```

---

## Support

For issues and feature requests, check the project documentation or contact your administrator.
