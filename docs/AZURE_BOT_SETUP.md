# Azure Bot Setup for Teams Integration (Future Reference)

_Created: 2025-12-16_
_Status: DEFERRED - To be implemented when ready for in-meeting AI_

---

## Overview

This document outlines how to set up an Azure Bot that can join Microsoft Teams meetings, capture audio, and conduct AI-powered interviews. This is the "Level 2" integration that enables the AI to be a participant in the meeting.

**Current Status:** Phase 2 (scheduling via Graph API) is complete. This Phase 3 integration is deferred due to hosting costs (~$100+/month for Azure VMs).

---

## Prerequisites

1. Azure subscription (pay-as-you-go or enterprise)
2. Microsoft 365 tenant with Teams
3. Admin consent for bot permissions
4. Azure AD app registration (already done for Phase 2)

---

## Cost Estimate

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Azure Bot Service | Free | Registration only |
| App Service (Basic) | Free-$55 | F1 free, B1 ~$55 |
| **Windows VM for Media Bot** | **$70-150** | D2s_v3 minimum |
| Bandwidth | $5-20 | Depends on usage |
| Azure Cognitive Services | Variable | If using Azure STT |
| **Total Estimated** | **$100-225/month** | For production workload |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Teams Meeting                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Manager  │  │Candidate │  │      AI Interview Bot        │  │
│  └──────────┘  └──────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Audio Stream
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Azure (Windows VM)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Bot Framework SDK                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ Call Handler│  │Media Platform│  │ Audio Processor │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Services                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ Whisper STT │  │   GPT-4o    │  │    OpenAI TTS       │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Register Azure Bot

### 1.1 Create Bot Resource

1. Go to Azure Portal → Create Resource → "Azure Bot"
2. Fill in:
   - Bot handle: `recruiting-ai-bot`
   - Subscription: Your subscription
   - Resource group: `recruiting-ai-rg`
   - Pricing tier: F0 (Free) for dev, S1 for production
   - Microsoft App ID: Create new or use existing

3. Click Create

### 1.2 Configure Bot Settings

In the Azure Bot resource:

1. Go to **Configuration**
2. Set Messaging endpoint: `https://your-domain.com/api/bot/messages`
3. Enable **Microsoft Teams** channel under Channels

### 1.3 App Registration Permissions

Add these permissions to your Azure AD app:

```
Microsoft Graph (Application):
- Calls.AccessMedia.All
- Calls.Initiate.All
- Calls.InitiateGroupCall.All
- Calls.JoinGroupCall.All
- Calls.JoinGroupCallAsGuest.All
```

Requires **admin consent** from tenant administrator.

---

## Step 2: Set Up Windows VM for Media Bot

### 2.1 Why Windows VM?

Microsoft requires real-time media bots to run on Windows Server in Azure. This is because:
- Media platform SDK only works on Windows
- Requires specific network configuration
- Needs direct access to Azure backbone

### 2.2 Create VM

1. Azure Portal → Create Resource → Windows Server 2019/2022
2. Recommended specs:
   - Size: D2s_v3 (2 vCPU, 8GB RAM) minimum
   - D4s_v3 (4 vCPU, 16GB RAM) for production
3. Enable:
   - Public IP (static)
   - Network security group with ports 443, 8445-8500 (TCP/UDP)

### 2.3 Install Dependencies

On the VM:

```powershell
# Install .NET SDK (for media platform)
winget install Microsoft.DotNet.SDK.7

# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install Visual C++ Redistributable
# (Required for media platform)
```

---

## Step 3: Implement Bot Code

### 3.1 Project Structure

```
src/bot/
├── index.ts                 # Bot entry point
├── botFramework/
│   ├── adapter.ts           # Bot Framework adapter
│   ├── callHandler.ts       # Handle incoming calls
│   └── mediaSession.ts      # Audio stream processing
├── transcription/
│   ├── whisperClient.ts     # OpenAI Whisper integration
│   └── streamProcessor.ts   # Audio chunk processing
└── interview/
    ├── aiInterviewer.ts     # Interview logic
    └── ttsClient.ts         # Text-to-speech
```

### 3.2 Bot Framework Adapter

```typescript
// src/bot/botFramework/adapter.ts
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import { TeamsInfo } from 'botbuilder-teams';

const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error('Bot error:', error);
  await context.sendActivity('Sorry, an error occurred.');
};

export { adapter };
```

### 3.3 Call Handler

```typescript
// src/bot/botFramework/callHandler.ts
import { CallState } from '@microsoft/microsoft-graph-types';

interface CallNotification {
  callId: string;
  state: CallState;
  meetingInfo?: {
    joinUrl: string;
  };
}

export async function handleIncomingCall(notification: CallNotification) {
  // Answer the call
  const response = await graphClient.api(`/communications/calls/${notification.callId}/answer`)
    .post({
      callbackUri: `${process.env.BOT_CALLBACK_URL}/api/bot/callback`,
      acceptedModalities: ['audio'],
      mediaConfig: {
        '@odata.type': '#microsoft.graph.appHostedMediaConfig',
        blob: '<media configuration blob>'
      }
    });

  return response;
}

export async function joinMeeting(joinUrl: string) {
  const call = await graphClient.api('/communications/calls')
    .post({
      '@odata.type': '#microsoft.graph.call',
      callbackUri: `${process.env.BOT_CALLBACK_URL}/api/bot/callback`,
      requestedModalities: ['audio'],
      mediaConfig: {
        '@odata.type': '#microsoft.graph.appHostedMediaConfig',
      },
      chatInfo: {
        '@odata.type': '#microsoft.graph.chatInfo',
        threadId: extractThreadId(joinUrl),
      },
      meetingInfo: {
        '@odata.type': '#microsoft.graph.organizerMeetingInfo',
        organizer: {
          '@odata.type': '#microsoft.graph.identitySet',
          user: {
            '@odata.type': '#microsoft.graph.identity',
            id: process.env.ORGANIZER_USER_ID,
          }
        }
      },
      tenantId: process.env.MICROSOFT_TENANT_ID,
    });

  return call;
}
```

### 3.4 Audio Processing

```typescript
// src/bot/transcription/streamProcessor.ts
import { Readable } from 'stream';

export class AudioStreamProcessor {
  private audioBuffer: Buffer[] = [];
  private readonly CHUNK_DURATION_MS = 5000; // 5 seconds

  processAudioChunk(chunk: Buffer) {
    this.audioBuffer.push(chunk);

    // When we have enough audio, send to Whisper
    if (this.getBufferDuration() >= this.CHUNK_DURATION_MS) {
      const audioData = Buffer.concat(this.audioBuffer);
      this.audioBuffer = [];
      return this.transcribe(audioData);
    }
  }

  private async transcribe(audioData: Buffer): Promise<string> {
    // Send to Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioData]), 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();
    return result.text;
  }
}
```

---

## Step 4: Teams App Manifest

### 4.1 Create manifest.json

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "{{BOT_APP_ID}}",
  "packageName": "com.yourcompany.recruitingai",
  "developer": {
    "name": "Your Company",
    "websiteUrl": "https://yourcompany.com",
    "privacyUrl": "https://yourcompany.com/privacy",
    "termsOfUseUrl": "https://yourcompany.com/terms"
  },
  "name": {
    "short": "AI Recruiting Assistant",
    "full": "AI-Powered Interview Assistant"
  },
  "description": {
    "short": "AI assistant for conducting interviews",
    "full": "An AI-powered recruiting assistant that joins Teams meetings to conduct structured interviews."
  },
  "icons": {
    "outline": "outline.png",
    "color": "color.png"
  },
  "accentColor": "#1e3a5f",
  "bots": [
    {
      "botId": "{{BOT_APP_ID}}",
      "scopes": ["team", "personal", "groupchat"],
      "supportsFiles": false,
      "isNotificationOnly": false,
      "supportsCalling": true,
      "supportsVideo": false
    }
  ],
  "permissions": [
    "identity",
    "messageTeamMembers"
  ],
  "validDomains": [
    "your-domain.com"
  ],
  "webApplicationInfo": {
    "id": "{{BOT_APP_ID}}",
    "resource": "api://your-domain.com/{{BOT_APP_ID}}"
  }
}
```

### 4.2 Deploy to Teams

1. Zip manifest.json + icons
2. Go to Teams Admin Center
3. Upload custom app
4. Approve for organization

---

## Step 5: Environment Variables

Add to `.env`:

```env
# Azure Bot (Phase 3 - Future)
MICROSOFT_APP_ID=your-bot-app-id
MICROSOFT_APP_PASSWORD=your-bot-app-secret
BOT_CALLBACK_URL=https://your-bot-domain.com

# Required when deploying media bot
MEDIA_PLATFORM_INSTANCE_PUBLIC_IP=your-vm-public-ip
MEDIA_PLATFORM_INSTANCE_PUBLIC_PORT=8445
```

---

## References

### Microsoft Documentation
- [Calls and meetings bots overview](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/calls-meetings-bots-overview)
- [Register a calling bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/registering-calling-bot)
- [Real-time media concepts](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/real-time-media-concepts)
- [Application-hosted media bots requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots)
- [Graph cloud communications](https://learn.microsoft.com/en-us/graph/cloud-communications-get-started)

### Sample Code
- [Microsoft Graph Communications Samples](https://github.com/microsoftgraph/microsoft-graph-comms-samples)
- [Teams AI Library](https://github.com/microsoft/teams-ai)

---

## When to Implement

Consider implementing this when:
1. You have validated the AI interview flow via web/phone
2. Customer demand for Teams-native experience is high
3. Budget allows for ~$100-200/month Azure hosting
4. You have resources for Azure/Teams certification process

---

## Alternative: Third-Party Services

If you want Teams bot functionality without building from scratch:

| Service | What it does | Cost |
|---------|--------------|------|
| [Recall.ai](https://recall.ai) | Meeting bot infrastructure | Usage-based |
| [Assembly.ai](https://assemblyai.com) | Real-time transcription | Usage-based |
| [Symbl.ai](https://symbl.ai) | Conversation intelligence | Usage-based |

These handle the bot hosting and audio capture, you just consume their APIs.
