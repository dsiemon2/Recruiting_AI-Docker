# Phase 3: Web-Based AI Interview System

_Created: 2025-12-16_

## Overview

Instead of building an Azure-hosted Teams bot ($100+/month), we'll implement the AI interview system as a **web-based application** that candidates access via a link. Teams integration (Phase 2) handles scheduling and calendar invites, while the actual interview happens in our web app.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Interview Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Schedule Interview (Phase 2 - DONE)                         │
│     └─► Teams meeting created + calendar invite sent            │
│     └─► Interview link generated: /interview/{token}            │
│                                                                  │
│  2. Candidate Joins (Phase 3 - NEW)                             │
│     └─► Candidate clicks interview link                         │
│     └─► Web app opens with AI interviewer                       │
│     └─► Browser captures audio via WebRTC                       │
│                                                                  │
│  3. AI Interview (Phase 3 - NEW)                                │
│     └─► Real-time transcription via Whisper                     │
│     └─► AI asks questions via TTS                               │
│     └─► AI generates follow-ups                                 │
│                                                                  │
│  4. Hybrid Mode (Optional)                                      │
│     └─► Manager joins via separate dashboard link               │
│     └─► Live transcript + controls                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components to Build

### 3.1 Interview Web App (Candidate View)

**URL:** `/interview/{interviewToken}`

**Features:**
- Welcome screen with interview instructions
- Microphone permission request
- AI interviewer with avatar/animation
- Real-time audio capture
- Visual indicators (listening, thinking, speaking)
- Progress bar showing question coverage
- End interview button

**Tech:**
- React or vanilla JS + EJS
- WebRTC for audio capture
- WebSocket for real-time communication
- OpenAI TTS for AI voice

### 3.2 Interview WebSocket Server

**Endpoint:** `ws://server/ws/interview/{sessionId}`

**Messages:**
```typescript
// Client -> Server
{ type: 'audio_chunk', data: base64AudioData }
{ type: 'candidate_ready' }
{ type: 'end_interview' }

// Server -> Client
{ type: 'ai_speaking', audioUrl: string, text: string }
{ type: 'ai_listening' }
{ type: 'ai_thinking' }
{ type: 'transcript_update', text: string, speaker: 'candidate' | 'ai' }
{ type: 'interview_complete' }
{ type: 'error', message: string }
```

### 3.3 AI Interview Engine

**Responsibilities:**
- Manage interview state (current question, time remaining)
- Process transcribed audio
- Generate follow-up questions
- Decide when to move to next question
- Handle interview flow (intro, questions, closing)

**Flow:**
```
Audio Chunk → Whisper STT → Transcript
                              ↓
                    Interview Engine
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
        Move to Next    Generate        End Interview
         Question       Follow-up
              ↓               ↓               ↓
           GPT-4o          GPT-4o          GPT-4o
              ↓               ↓               ↓
         TTS Audio       TTS Audio       Summary
```

### 3.4 Manager Dashboard (Hybrid Mode)

**URL:** `/interview/{interviewToken}/manage`

**Features:**
- Live transcript display
- Question queue with skip/reorder
- "Have AI ask next question" button
- Suggested follow-ups (approve/dismiss)
- Notes panel
- Coverage indicator
- End interview button

### 3.5 Audio Processing Pipeline

```
Browser Mic → MediaRecorder API → WebSocket → Server
                                              ↓
                                    Audio Buffer (5s chunks)
                                              ↓
                                    Whisper API (STT)
                                              ↓
                                    Transcript Store
                                              ↓
                                    Interview Engine
```

---

## Implementation Tasks

### Phase 3.1: Basic Web Interview UI
- [ ] Create interview entry page (`/interview/:token`)
- [ ] Token validation middleware
- [ ] Microphone permission flow
- [ ] Basic interview UI layout
- [ ] Audio capture with MediaRecorder API

### Phase 3.2: WebSocket Infrastructure
- [ ] Interview WebSocket handler (`src/realtime/interviewHandler.ts`)
- [ ] Session state management
- [ ] Audio chunk processing
- [ ] Message protocol implementation

### Phase 3.3: Speech-to-Text Integration
- [ ] Whisper API client
- [ ] Audio buffer management (5-second chunks)
- [ ] Real-time transcript updates
- [ ] Speaker identification (simple: AI vs Candidate)

### Phase 3.4: AI Interview Logic
- [ ] Interview state machine
- [ ] Question flow controller
- [ ] GPT-4o integration for follow-ups
- [ ] Time management per question
- [ ] Graceful interview closing

### Phase 3.5: Text-to-Speech
- [ ] OpenAI TTS API integration
- [ ] Audio streaming to client
- [ ] Voice selection (use voices from config)
- [ ] Natural pacing between sentences

### Phase 3.6: Hybrid Mode Dashboard
- [ ] Manager view with live transcript
- [ ] Question queue UI
- [ ] Control buttons (next question, end)
- [ ] Real-time sync with candidate session

### Phase 3.7: Interview Completion
- [ ] Auto-generate transcript record
- [ ] Trigger summary generation (Phase 4)
- [ ] Update interview status
- [ ] Send completion notifications

---

## File Structure

```
src/
├── realtime/
│   ├── interviewHandler.ts      # WebSocket handler
│   ├── sessionManager.ts        # Interview session state
│   ├── audioProcessor.ts        # Audio chunk handling
│   └── messageTypes.ts          # WebSocket message types
│
├── services/
│   └── ai/
│       ├── whisperClient.ts     # Speech-to-text
│       ├── ttsClient.ts         # Text-to-speech
│       ├── interviewEngine.ts   # AI interview logic
│       └── followUpGenerator.ts # Generate follow-ups
│
└── routes/
    └── interviewSession.ts      # Interview page routes

views/
├── interview/
│   ├── candidate.ejs            # Candidate interview view
│   ├── manager.ejs              # Manager hybrid view
│   └── complete.ejs             # Interview complete page
│
└── partials/
    └── interview/
        ├── audio-visualizer.ejs
        ├── transcript-panel.ejs
        └── question-queue.ejs
```

---

## Database Updates

### InterviewSession additions:
```prisma
model InterviewSession {
  // ... existing fields

  // New fields for web interview
  interviewToken    String    @unique @default(uuid())
  webSessionStarted DateTime?
  webSessionEnded   DateTime?
  audioRecordingUrl String?   // If we store recordings
}
```

### New model for real-time data:
```prisma
model TranscriptSegment {
  id           String   @id @default(uuid())
  sessionId    String
  session      InterviewSession @relation(...)
  speaker      String   // 'candidate' | 'ai'
  text         String
  timestamp    DateTime
  questionId   String?  // Which question this relates to
}
```

---

## API Endpoints

### Interview Session
```
GET  /interview/:token           # Candidate interview page
GET  /interview/:token/manage    # Manager dashboard
POST /interview/:token/start     # Start interview session
POST /interview/:token/end       # End interview session
GET  /interview/:token/status    # Get current status
```

### WebSocket
```
WS   /ws/interview/:sessionId    # Real-time interview connection
```

---

## Environment Variables

```env
# OpenAI (already have OPENAI_API_KEY)
OPENAI_TTS_VOICE=alloy           # Default TTS voice

# Interview Settings
INTERVIEW_CHUNK_DURATION_MS=5000  # Audio chunk size
INTERVIEW_MAX_DURATION_MINS=60    # Max interview length
INTERVIEW_TOKEN_EXPIRY_HOURS=48   # How long interview links are valid
```

---

## Benefits of Web-Based Approach

1. **No Azure VM costs** - Runs on existing Node.js server
2. **Works everywhere** - Any browser with mic access
3. **Easier to develop** - Standard web tech stack
4. **Simpler deployment** - No Windows Server required
5. **Better control** - Full control over UI/UX
6. **Mobile friendly** - Works on phones/tablets

---

## Future: Add Teams Bot

When ready to add Teams bot:
1. Keep web interview as fallback option
2. Bot joins Teams meeting and redirects audio to same pipeline
3. See `AZURE_BOT_SETUP.md` for implementation details

---

## Next Steps

1. Create basic interview UI (`views/interview/candidate.ejs`)
2. Implement WebSocket handler for audio streaming
3. Integrate Whisper API for transcription
4. Build AI interview state machine
5. Add TTS for AI responses
6. Test end-to-end flow
