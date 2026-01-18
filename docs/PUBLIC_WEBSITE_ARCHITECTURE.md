# RecruitingAI Public Website Architecture

## Overview

This document defines the architecture, page structure, and design specifications for the public-facing marketing website that sits in front of the admin application. This includes landing pages, pricing, signup/signin flows, and support.

---

## Site Map

```
recruitingai.com/
├── / (Homepage/Landing)
├── /how-it-works
├── /features
├── /pricing
├── /integrations
├── /signup
├── /signin
├── /forgot-password
├── /contact
├── /demo (Book a Demo form)
├── /live-demo (Interactive self-service demo)
├── /about
├── /blog (optional - future)
├── /legal
│   ├── /privacy
│   ├── /terms
│   └── /security
└── /app (redirect to admin dashboard)
```

---

## Page-by-Page Specifications

### 1. Homepage (Landing Page)

**URL:** `/`
**Purpose:** First impression, convert visitors to trials/demos
**Target Conversion Rate:** 3-10% (industry average: 3%, top performers: 9.5%)

#### Section Structure (Top to Bottom)

| Section | Content | Priority |
|---------|---------|----------|
| **Navigation Bar** | Logo, How It Works, Features, Pricing, Integrations, Sign In, [Start Free Trial] CTA | Critical |
| **Hero Section** | Headline, subheadline, CTA buttons, hero image/video | Critical |
| **Social Proof Bar** | Client logos, "Trusted by X companies" | High |
| **Problem/Solution** | Pain points addressed, 3 key benefits | High |
| **How It Works** | 3-step visual process | High |
| **Features Overview** | 3-6 feature cards with icons | Medium |
| **Testimonials** | 2-3 customer quotes with photos | High |
| **Stats/Numbers** | "10,000+ interviews conducted" type metrics | Medium |
| **Pricing Preview** | 3 tier cards with "View Full Pricing" | Medium |
| **Final CTA** | "Ready to transform your hiring?" + buttons | Critical |
| **Footer** | Links, social, legal, contact | Standard |

#### Hero Section Spec

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]    How It Works  Features  Pricing  |  Sign In  [Start Free Trial] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   AI-Powered Interviews                    ┌─────────────────┐  │
│   That Scale Your Hiring                   │                 │  │
│                                            │  Product Demo   │  │
│   Conduct hundreds of structured           │  Screenshot or  │  │
│   interviews automatically. Save 80%       │  Video          │  │
│   of recruiter time while finding          │                 │  │
│   better candidates.                       └─────────────────┘  │
│                                                                 │
│   [Start Free Trial]  [Watch Demo]                              │
│                                                                 │
│   ✓ No credit card required  ✓ 14-day free trial               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Messaging Framework

| Element | Content |
|---------|---------|
| **Headline** | "AI-Powered Interviews That Scale Your Hiring" |
| **Subheadline** | "Conduct hundreds of structured interviews automatically. Save 80% of recruiter time while finding better candidates." |
| **Primary CTA** | "Start Free Trial" (button, high contrast) |
| **Secondary CTA** | "Watch Demo" or "Book a Demo" (outline button) |
| **Trust Indicators** | "No credit card required" • "14-day free trial" • "Cancel anytime" |

---

### 2. How It Works Page

**URL:** `/how-it-works`
**Purpose:** Educate prospects on the product workflow

#### Section Structure

| Section | Content |
|---------|---------|
| **Header** | "How RecruitingAI Works" |
| **3-Step Process** | Visual numbered steps with illustrations |
| **Detailed Walkthrough** | Expandable sections for each step |
| **Video Demo** | 2-3 minute product walkthrough |
| **Integration Flow** | How it fits with existing tools |
| **CTA** | "See It In Action" → Demo request |

#### The 3-Step Process

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     1       │     │     2       │     │     3       │
│  CONFIGURE  │ ──► │  INTERVIEW  │ ──► │   REVIEW    │
│             │     │             │     │             │
│ Set up job  │     │ AI conducts │     │ Review      │
│ roles and   │     │ structured  │     │ transcripts │
│ questions   │     │ interviews  │     │ & analytics │
└─────────────┘     └─────────────┘     └─────────────┘
```

#### Detailed Steps Content

**Step 1: Configure Your Interview**
- Create job roles with specific requirements
- Build question sets from templates or custom
- Set scoring criteria and must-have responses
- Configure scheduling and notifications

**Step 2: AI Conducts Interviews**
- Candidates receive interview invites
- AI interviewer asks questions naturally
- Handles follow-ups and clarifications
- Available 24/7 in 24 languages

**Step 3: Review & Decide**
- Full transcripts with AI summaries
- Candidate scoring and ranking
- Analytics and insights dashboard
- Export to ATS or share with team

---

### 3. Features Page

**URL:** `/features`
**Purpose:** Deep dive into capabilities

#### Feature Categories

| Category | Features |
|----------|----------|
| **AI Interviewing** | Natural conversation, follow-up questions, 24 languages |
| **Customization** | Question banks, scoring rubrics, branding |
| **Analytics** | Candidate scoring, time-to-hire metrics, funnel analysis |
| **Integrations** | MS Teams, ATS systems, webhooks, API |
| **Automation** | Scheduling, notifications, logic rules |
| **Security** | SOC2 compliance, data encryption, GDPR ready |

#### Feature Card Template

```
┌──────────────────────────────────┐
│  [Icon]                          │
│                                  │
│  Feature Name                    │
│  ─────────────                   │
│  2-3 sentence description of     │
│  the feature and its benefit     │
│  to the user.                    │
│                                  │
│  [Learn More →]                  │
└──────────────────────────────────┘
```

---

### 4. Pricing Page

**URL:** `/pricing`
**Purpose:** Convert informed prospects, transparent pricing

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Simple, Transparent Pricing                   │
│           Start free. Upgrade when you're ready.                 │
│                                                                 │
│            [Monthly ○]  [Annual ● Save 20%]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐    ┌───────────────┐    ┌───────────┐           │
│  │  STARTER  │    │ PROFESSIONAL  │    │ BUSINESS  │           │
│  │           │    │  MOST POPULAR │    │           │           │
│  │  $49/mo   │    │    $99/mo     │    │  $199/mo  │           │
│  │           │    │               │    │           │           │
│  │ 25 int/mo │    │  100 int/mo   │    │ Unlimited │           │
│  │ 3 roles   │    │   10 roles    │    │ Unlimited │           │
│  │ 2 users   │    │   5 users     │    │ 15 users  │           │
│  │           │    │               │    │           │           │
│  │ [Start    │    │ [Start Free   │    │ [Start    │           │
│  │  Trial]   │    │    Trial]     │    │  Trial]   │           │
│  └───────────┘    └───────────────┘    └───────────┘           │
│                                                                 │
│                   Need more? [Contact Sales]                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Page Sections

1. **Headline**: "Simple, Transparent Pricing"
2. **Toggle**: Monthly / Annual (show savings)
3. **Pricing Cards**: 3 tiers side by side
4. **Feature Comparison Table**: Detailed matrix
5. **FAQ Section**: Common pricing questions
6. **Enterprise CTA**: "Need custom solution? Contact us"

#### Pricing FAQ (Collapsible)

- What's included in the free trial?
- Can I change plans later?
- What happens if I exceed my interview limit?
- Do you offer discounts for nonprofits/startups?
- What payment methods do you accept?
- Is there a setup fee?
- Can I cancel anytime?

---

### 5. Sign Up Page

**URL:** `/signup`
**Purpose:** New user registration
**Target:** Minimize friction, maximize conversions

#### Two-Step Registration Flow

**Step 1: Account Creation**
```
┌─────────────────────────────────────────────────────────────────┐
│                      Start Your Free Trial                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │   Full Name        [________________________]           │    │
│  │                                                         │    │
│  │   Work Email       [________________________]           │    │
│  │                                                         │    │
│  │   Password         [________________________]           │    │
│  │                     Must be 8+ characters               │    │
│  │                                                         │    │
│  │   [  Create Account  ]                                  │    │
│  │                                                         │    │
│  │   ─────────── or ───────────                            │    │
│  │                                                         │    │
│  │   [G] Continue with Google                              │    │
│  │   [M] Continue with Microsoft                           │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│   By signing up, you agree to our Terms of Service              │
│   and Privacy Policy.                                           │
│                                                                 │
│   Already have an account? [Sign In]                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│   ✓ 14-day free trial    ✓ No credit card    ✓ Cancel anytime  │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: Company Setup (Post Email Verification)**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Tell Us About Your Company                   │
│                                                                 │
│     ●────────○ Step 2 of 2                                      │
│                                                                 │
│   Company Name      [________________________]                   │
│                                                                 │
│   Company Size      [▼ Select one              ]                │
│                       1-10 employees                            │
│                       11-50 employees                           │
│                       51-200 employees                          │
│                       201-500 employees                         │
│                       500+ employees                            │
│                                                                 │
│   How did you       [▼ Select one              ]                │
│   hear about us?      Google Search                             │
│                       LinkedIn                                  │
│                       Referral                                  │
│                       Other                                     │
│                                                                 │
│   [  Complete Setup  ]                                          │
│                                                                 │
│   [Skip for now]                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Form Field Requirements

| Field | Required | Validation |
|-------|----------|------------|
| Full Name | Yes | Min 2 characters |
| Work Email | Yes | Valid email format, not personal (gmail, yahoo, etc.) |
| Password | Yes | Min 8 chars, 1 uppercase, 1 number |
| Company Name | Yes (Step 2) | Min 2 characters |
| Company Size | Optional | Dropdown |
| Referral Source | Optional | Dropdown |

#### Social Sign-Up Options

- Google Workspace (recommended for business)
- Microsoft 365 (for enterprise users)

---

### 6. Sign In Page

**URL:** `/signin`
**Purpose:** Existing user authentication

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Welcome Back                              │
│                                                                 │
│   Email             [________________________]                   │
│                                                                 │
│   Password          [________________________]  [👁]             │
│                                                                 │
│   [ ] Remember me            [Forgot password?]                 │
│                                                                 │
│   [  Sign In  ]                                                 │
│                                                                 │
│   ─────────── or ───────────                                    │
│                                                                 │
│   [G] Continue with Google                                      │
│   [M] Continue with Microsoft                                   │
│                                                                 │
│   Don't have an account? [Sign Up Free]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Security Features

- Rate limiting (5 attempts per 15 minutes)
- CAPTCHA after 3 failed attempts
- Account lockout notification
- "Sign in from new device" email alerts
- Session management (remember me = 30 days, otherwise 24 hours)

---

### 7. Forgot Password Flow

**URL:** `/forgot-password`

#### Step 1: Request Reset
```
Enter your email address and we'll send you a link to reset your password.

Email: [________________________]

[Send Reset Link]

[← Back to Sign In]
```

#### Step 2: Email Sent Confirmation
```
Check your email

We've sent a password reset link to j***@company.com.
The link expires in 1 hour.

Didn't receive it? [Resend email]
```

#### Step 3: Reset Password (from email link)
```
Create new password

New Password      [________________________]
                  Must be 8+ characters

Confirm Password  [________________________]

[Reset Password]
```

---

### 8. Contact / Chat Page

**URL:** `/contact`
**Purpose:** Sales inquiries, support, general contact

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Get In Touch                              │
│                                                                 │
│   ┌─────────────────────┐   ┌─────────────────────────────────┐ │
│   │                     │   │                                 │ │
│   │  💬 Sales           │   │  Contact Form                   │ │
│   │  Talk to our team   │   │                                 │ │
│   │  [Book a Demo]      │   │  Name    [_________________]    │ │
│   │                     │   │  Email   [_________________]    │ │
│   │  📧 Support         │   │  Company [_________________]    │ │
│   │  support@...        │   │                                 │ │
│   │  [Open Ticket]      │   │  Topic   [▼ Select          ]   │ │
│   │                     │   │            Sales inquiry        │ │
│   │  📞 Phone           │   │            Technical support    │ │
│   │  1-800-XXX-XXXX     │   │            Partnership          │ │
│   │  Mon-Fri 9am-6pm ET │   │            Other                │ │
│   │                     │   │                                 │ │
│   │  💼 Enterprise      │   │  Message                        │ │
│   │  enterprise@...     │   │  [_________________________]    │ │
│   │                     │   │  [_________________________]    │ │
│   └─────────────────────┘   │  [_________________________]    │ │
│                             │                                 │ │
│                             │  [Send Message]                 │ │
│                             └─────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9. Live Chat Widget

**Implementation:** Floating widget on all pages

#### Recommended Providers

| Provider | Best For | Pricing |
|----------|----------|---------|
| **Intercom** | Full-featured, AI bots | $74+/mo |
| **Crisp** | Budget-friendly | Free - $95/mo |
| **Tawk.to** | Free option | Free |
| **Drift** | Sales-focused | $400+/mo |
| **Zendesk** | Existing Zendesk users | $55+/mo |

#### Widget Behavior

| Page | Behavior |
|------|----------|
| Homepage | Auto-popup after 30 seconds |
| Pricing | Proactive "Need help choosing?" |
| Sign Up | Hidden (reduce distraction) |
| Sign In | Hidden |
| All Others | Available on click |

#### Chat Flow

```
┌──────────────────────────────┐
│  💬 Chat with us             │
├──────────────────────────────┤
│                              │
│  Hi! 👋 How can we help?     │
│                              │
│  [I have a sales question]   │
│  [I need technical help]     │
│  [I want to book a demo]     │
│  [Something else]            │
│                              │
├──────────────────────────────┤
│  [Type your message...]  [→] │
└──────────────────────────────┘
```

---

### 10. Demo Request Page

**URL:** `/demo`
**Purpose:** Capture high-intent leads for sales team

#### Form Fields

| Field | Required | Purpose |
|-------|----------|---------|
| First Name | Yes | Personalization |
| Last Name | Yes | Personalization |
| Work Email | Yes | Contact |
| Phone Number | No | Follow-up |
| Company Name | Yes | Research |
| Company Size | Yes | Qualification |
| Current ATS | No | Discovery |
| Preferred Time | Yes | Scheduling |
| Anything else? | No | Context |

#### Post-Submit Flow

1. Show confirmation message
2. Send confirmation email with calendar invite
3. Redirect to "What to Expect" page
4. Trigger sales notification

---

### 11. Live Demo / Interactive Demo Page

**URL:** `/live-demo`
**Purpose:** Self-service product experience without sales call
**Target:** Prospects who want to explore before talking to sales

#### Three Demo Options

```
┌─────────────────────────────────────────────────────────────────┐
│                    Experience RecruitingAI                       │
│         Choose how you'd like to explore our platform            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │                 │  │                 │  │                 │  │
│  │  🎬 WATCH       │  │  🎮 TRY IT      │  │  👤 TALK TO     │  │
│  │                 │  │                 │  │                 │  │
│  │  Video Demo     │  │  Interactive    │  │  Our Team       │  │
│  │  5-minute       │  │  Sandbox        │  │  Live Demo      │  │
│  │  overview       │  │  Demo           │  │  Call           │  │
│  │                 │  │                 │  │                 │  │
│  │  [Watch Now]    │  │  [Try Now]      │  │  [Book Demo]    │  │
│  │                 │  │                 │  │                 │  │
│  │  No signup      │  │  Email only     │  │  15-30 min      │  │
│  │  required       │  │  required       │  │  with expert    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Option A: Video Demo (Watch)

**Purpose:** Quick product overview for busy prospects

**Implementation:**
- Embedded video player (Wistia, Vimeo, YouTube)
- Chapters/timestamps for navigation
- No gate (no email required)
- CTA overlay at end: "Ready to try it? Start your free trial"

**Video Content Outline (5 minutes):**
1. **0:00-0:30** - Problem statement (hiring is slow and expensive)
2. **0:30-1:30** - Platform overview (dashboard walkthrough)
3. **1:30-3:00** - Feature highlights (AI interviews, analytics)
4. **3:00-4:00** - Real interview demo
5. **4:00-5:00** - Results and ROI + CTA

#### Option B: Interactive Sandbox Demo (Try)

**Purpose:** Hands-on product experience with sample data

**Gate:** Email capture only (low friction)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Try the Interactive Demo                      │
│                                                                 │
│   Enter your work email to access the demo environment           │
│                                                                 │
│   Work Email    [________________________]                       │
│                                                                 │
│   [Launch Demo →]                                               │
│                                                                 │
│   ✓ Pre-loaded with sample data                                 │
│   ✓ Full feature access                                         │
│   ✓ No credit card required                                     │
│   ✓ Expires in 30 minutes                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Sandbox Features:**
| Feature | Status | Sample Data |
|---------|--------|-------------|
| Dashboard | Full access | 50 sample interviews |
| Job Roles | View + Create | 3 pre-built roles |
| Questions | View + Edit | 25 sample questions |
| Interviews | View replays | 5 completed interviews |
| Analytics | Full access | 30 days of data |
| Settings | Limited | Can't save changes |

**Guided Tour (Optional):**
- Tooltips highlighting key features
- Suggested actions ("Try creating a job role")
- Progress indicator (5 steps)
- Skip option for power users

**Implementation Options:**

| Tool | Type | Cost |
|------|------|------|
| **Navattic** | Interactive product demos | $500+/mo |
| **Storylane** | No-code demo builder | $40+/mo |
| **Walnut** | Sales demo platform | $500+/mo |
| **Tourial** | Interactive tours | $300+/mo |
| **Custom sandbox** | Real app instance | Dev time |

**Recommendation:** Start with **Storylane** ($40/mo) for quick setup, or build a custom read-only sandbox instance for authenticity.

#### Option C: Live Demo with Sales (Book)

**Purpose:** Personalized walkthrough with Q&A

**Scheduling Tool:** Calendly, HubSpot Meetings, or Cal.com

```
┌─────────────────────────────────────────────────────────────────┐
│                    Book a Live Demo                              │
│        Get a personalized walkthrough with our team              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  [Calendly or booking widget embedded here]                 │ │
│  │                                                             │ │
│  │  Select a time:                                             │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│  │  │ Mon     │ │ Tue     │ │ Wed     │ │ Thu     │           │ │
│  │  │ Dec 30  │ │ Dec 31  │ │ Jan 1   │ │ Jan 2   │           │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │ │
│  │                                                             │ │
│  │  Available times (EST):                                     │ │
│  │  [10:00 AM] [11:00 AM] [2:00 PM] [3:00 PM]                 │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  What to expect:                                                │
│  • 15-30 minute personalized demo                               │
│  • See features relevant to your use case                       │
│  • Get your questions answered live                             │
│  • No obligation, no pressure                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pre-Demo Form Fields:**
| Field | Required | Purpose |
|-------|----------|---------|
| First Name | Yes | Greeting |
| Last Name | Yes | Greeting |
| Work Email | Yes | Calendar invite |
| Company | Yes | Prep research |
| Company Size | Yes | Customize demo |
| What interests you most? | No | Focus demo |
| Current tools/ATS | No | Compare features |

**Post-Booking Flow:**
1. Confirmation page with meeting details
2. Calendar invite sent immediately
3. Reminder email 24 hours before
4. Reminder email 1 hour before
5. Post-demo follow-up with trial link

#### Live Demo Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]   How It Works   Features   Pricing   |   Sign In  [Trial]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│            See RecruitingAI in Action                           │
│     Choose the demo experience that works best for you          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      [3 Demo Cards]                       │  │
│  │           Watch Video | Try Sandbox | Book Demo           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│              "This is exactly what we needed!"                  │
│        - Sarah M., HR Director at TechCorp                      │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  Frequently Asked Questions                                     │
│  ▶ How long is the interactive demo?                           │
│  ▶ Is my data saved in the demo?                               │
│  ▶ Can I invite my team to a live demo?                        │
│  ▶ What happens after the demo?                                │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  Still have questions?  [Chat with us]  [Contact Sales]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Demo Analytics to Track

| Metric | Why It Matters |
|--------|----------------|
| Video completion rate | Content engagement |
| Sandbox activation rate | Interest level |
| Sandbox time spent | Engagement depth |
| Features explored | Product fit signals |
| Demo-to-trial conversion | Funnel effectiveness |
| Demo-to-meeting conversion | Sales pipeline |

---

## Navigation Structure

### Primary Navigation (Desktop)

```
[Logo]   How It Works   Features   Pricing   Integrations   |   Sign In   [Start Free Trial]
```

### Mobile Navigation

```
[Logo]                                                      [☰ Menu]

┌─────────────────────┐
│ How It Works        │
│ Features            │
│ Pricing             │
│ Integrations        │
│ ─────────────────── │
│ Sign In             │
│ [Start Free Trial]  │
└─────────────────────┘
```

### Footer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Logo]                Product        Company       Support     │
│                        ─────────      ─────────     ─────────   │
│  AI-powered            Features       About         Help Center │
│  recruiting            Pricing        Careers       Contact     │
│  for modern            Integrations   Blog          API Docs    │
│  teams.                Security       Press         Status      │
│                        Changelog                                │
│                                                                 │
│  [📧 Newsletter signup field]              [f] [in] [𝕏] [yt]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  © 2024 RecruitingAI   •   Privacy   •   Terms   •   Security   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Frontend Stack Options

| Option | Pros | Cons |
|--------|------|------|
| **Next.js** | SEO, React, fast | More complex |
| **Astro** | Fast, simple, any framework | Less dynamic |
| **Static HTML/CSS** | Simple, fast | Manual updates |
| **EJS (extend current)** | Unified codebase | Less modern |

**Recommendation:** Use **Next.js** or **Astro** for public site, separate from admin app.

### Hosting Options

| Option | Cost | Features |
|--------|------|----------|
| **Vercel** | Free-$20/mo | Next.js native, edge, analytics |
| **Netlify** | Free-$19/mo | Forms, functions, easy deploys |
| **Cloudflare Pages** | Free | Fast edge, free bandwidth |
| **Same server** | $0 extra | Simple, unified |

### Domain Structure

| URL | Purpose |
|-----|---------|
| `recruitingai.com` | Marketing site |
| `app.recruitingai.com` | Admin application |
| `api.recruitingai.com` | API endpoints |
| `docs.recruitingai.com` | Documentation (optional) |

---

## Conversion Optimization Checklist

### Trust Elements (Every Page)

- [ ] Client logos (social proof bar)
- [ ] Security badges (SOC2, GDPR, SSL)
- [ ] Review badges (G2, Capterra ratings)
- [ ] "No credit card required" messaging
- [ ] Trust pilot / customer reviews

### CTA Optimization

- [ ] Single primary CTA per page
- [ ] High contrast CTA buttons
- [ ] Action-oriented text ("Start Free Trial" not "Submit")
- [ ] Urgency when appropriate ("Limited time")
- [ ] Reduce anxiety ("Cancel anytime")

### Mobile Optimization

- [ ] Touch-friendly buttons (min 44x44px)
- [ ] Readable fonts (min 16px body)
- [ ] No horizontal scrolling
- [ ] Fast load time (<3 seconds)
- [ ] Sticky mobile CTA

### Analytics & Tracking

- [ ] Google Analytics 4
- [ ] Conversion tracking (signups, demos)
- [ ] Heatmaps (Hotjar, Microsoft Clarity)
- [ ] A/B testing capability
- [ ] UTM parameter tracking

---

## Implementation Priority

### Phase 1: MVP (Week 1-2)
1. Homepage with hero + basic sections
2. Sign Up / Sign In pages
3. Pricing page
4. Basic contact form

### Phase 2: Complete (Week 3-4)
1. How It Works page
2. Features page
3. Demo booking flow
4. Live chat integration

### Phase 3: Optimization (Ongoing)
1. A/B testing headlines
2. Testimonials and case studies
3. Blog / content marketing
4. SEO optimization

---

## Sources & References

- [SaaS Landing Page Best Practices - Unbounce](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [SaaS Signup Flow UX Guide - UserPilot](https://userpilot.com/blog/saas-signup-flow/)
- [B2B SaaS Website Best Practices - Drewl](https://drewl.com/resources/b2b-saas-website-best-practices)
- [SaaS Registration Best Practices - Regpacks](https://www.regpacks.com/blog/saas-registration-process/)
- [High-Converting SaaS Landing Pages - KlientBoost](https://www.klientboost.com/landing-pages/saas-landing-page/)

---

*Last Updated: December 2024*
