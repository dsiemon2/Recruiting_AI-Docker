import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create super admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'superadmin@system.local' },
    update: {},
    create: {
      email: 'superadmin@system.local',
      password: superAdminPassword,
      name: 'System Administrator',
    },
  });
  console.log('Created super admin:', superAdmin.email);

  // Create demo company with industry
  const company = await prisma.company.upsert({
    where: { domain: 'demo.local' },
    update: {
      industry: 'Technology',
      size: '51-200',
    },
    create: {
      name: 'Demo Company',
      domain: 'demo.local',
      industry: 'Technology',
      size: '51-200',
    },
  });
  console.log('Created company:', company.name);

  // Create company admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email_companyId: { email: 'admin@demo.local', companyId: company.id } },
    update: {},
    create: {
      email: 'admin@demo.local',
      password: adminPassword,
      name: 'Demo Admin',
      role: 'COMPANY_ADMIN',
      companyId: company.id,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create manager
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email_companyId: { email: 'manager@demo.local', companyId: company.id } },
    update: {},
    create: {
      email: 'manager@demo.local',
      password: managerPassword,
      name: 'Demo Manager',
      role: 'MANAGER',
      companyId: company.id,
    },
  });
  console.log('Created manager user:', manager.email);

  // Create supervisor
  const supervisorPassword = await bcrypt.hash('supervisor123', 12);
  const supervisor = await prisma.user.upsert({
    where: { email_companyId: { email: 'supervisor@demo.local', companyId: company.id } },
    update: {},
    create: {
      email: 'supervisor@demo.local',
      password: supervisorPassword,
      name: 'Demo Supervisor',
      role: 'SUPERVISOR',
      companyId: company.id,
    },
  });
  console.log('Created supervisor user:', supervisor.email);

  // Create candidate
  const candidatePassword = await bcrypt.hash('candidate123', 12);
  const candidate = await prisma.user.upsert({
    where: { email_companyId: { email: 'candidate@demo.local', companyId: company.id } },
    update: {},
    create: {
      email: 'candidate@demo.local',
      password: candidatePassword,
      name: 'Demo Candidate',
      role: 'CANDIDATE',
      companyId: company.id,
    },
  });
  console.log('Created candidate user:', candidate.email);

  // Create job role: Software Engineer
  const softwareEngineer = await prisma.jobRole.upsert({
    where: { id: 'software-engineer-demo' },
    update: {},
    create: {
      id: 'software-engineer-demo',
      title: 'Software Engineer',
      description: 'Full-stack software engineer position',
      companyId: company.id,
    },
  });
  console.log('Created job role:', softwareEngineer.title);

  // Create question categories
  const technicalCategory = await prisma.questionCategory.upsert({
    where: { name_jobRoleId: { name: 'Technical', jobRoleId: softwareEngineer.id } },
    update: {},
    create: {
      name: 'Technical',
      order: 0,
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
  });

  const behavioralCategory = await prisma.questionCategory.upsert({
    where: { name_jobRoleId: { name: 'Behavioral', jobRoleId: softwareEngineer.id } },
    update: {},
    create: {
      name: 'Behavioral',
      order: 1,
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
  });

  const cultureFitCategory = await prisma.questionCategory.upsert({
    where: { name_jobRoleId: { name: 'Culture Fit', jobRoleId: softwareEngineer.id } },
    update: {},
    create: {
      name: 'Culture Fit',
      order: 2,
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
  });
  console.log('Created question categories');

  // Create technical questions
  const technicalQuestions = [
    {
      text: 'Explain the difference between REST and GraphQL APIs. When would you choose one over the other?',
      followUps: ['Can you give an example from your experience?', 'How would you handle versioning in each approach?'],
      evaluationCriteria: 'Understands architectural trade-offs, can articulate pros/cons clearly',
      timeAllocation: 5,
      isRequired: true,
    },
    {
      text: 'Describe how you would design a scalable notification system that handles millions of users.',
      followUps: ['How would you handle message queuing?', 'What about real-time vs batch delivery?'],
      evaluationCriteria: 'System design thinking, knowledge of distributed systems, practical considerations',
      timeAllocation: 8,
      isRequired: true,
    },
    {
      text: 'What is your debugging process when you encounter a production issue?',
      followUps: ['Can you walk me through a recent example?', 'How do you prioritize when multiple issues arise?'],
      evaluationCriteria: 'Systematic approach, use of tools, communication during incidents',
      timeAllocation: 5,
      isRequired: false,
    },
  ];

  for (let i = 0; i < technicalQuestions.length; i++) {
    const q = technicalQuestions[i];
    await prisma.question.upsert({
      where: { id: `tech-q-${i + 1}` },
      update: {},
      create: {
        id: `tech-q-${i + 1}`,
        text: q.text,
        followUps: JSON.stringify(q.followUps),
        evaluationCriteria: q.evaluationCriteria,
        timeAllocation: q.timeAllocation,
        isRequired: q.isRequired,
        order: i,
        categoryId: technicalCategory.id,
      },
    });
  }
  console.log('Created technical questions');

  // Create behavioral questions
  const behavioralQuestions = [
    {
      text: 'Tell me about a time when you had a disagreement with a team member. How did you resolve it?',
      followUps: ['What would you do differently?', 'How did this affect your working relationship afterwards?'],
      evaluationCriteria: 'Conflict resolution, communication skills, self-awareness',
      timeAllocation: 5,
      isRequired: true,
    },
    {
      text: 'Describe a project you\'re most proud of. What was your specific contribution?',
      followUps: ['What challenges did you overcome?', 'What did you learn from this experience?'],
      evaluationCriteria: 'Technical depth, ownership, ability to articulate impact',
      timeAllocation: 6,
      isRequired: true,
    },
  ];

  for (let i = 0; i < behavioralQuestions.length; i++) {
    const q = behavioralQuestions[i];
    await prisma.question.upsert({
      where: { id: `behav-q-${i + 1}` },
      update: {},
      create: {
        id: `behav-q-${i + 1}`,
        text: q.text,
        followUps: JSON.stringify(q.followUps),
        evaluationCriteria: q.evaluationCriteria,
        timeAllocation: q.timeAllocation,
        isRequired: q.isRequired,
        order: i,
        categoryId: behavioralCategory.id,
      },
    });
  }
  console.log('Created behavioral questions');

  // Create culture fit questions
  const cultureFitQuestions = [
    {
      text: 'Why are you interested in this company and role?',
      followUps: ['What research have you done about our company?', 'How does this align with your career goals?'],
      evaluationCriteria: 'Genuine interest, research effort, alignment with company values',
      timeAllocation: 4,
      isRequired: true,
    },
    {
      text: 'What type of work environment helps you do your best work?',
      followUps: ['How do you handle remote vs in-office work?', 'What about collaboration vs independent work?'],
      evaluationCriteria: 'Self-awareness, fit with team culture, adaptability',
      timeAllocation: 4,
      isRequired: false,
    },
  ];

  for (let i = 0; i < cultureFitQuestions.length; i++) {
    const q = cultureFitQuestions[i];
    await prisma.question.upsert({
      where: { id: `culture-q-${i + 1}` },
      update: {},
      create: {
        id: `culture-q-${i + 1}`,
        text: q.text,
        followUps: JSON.stringify(q.followUps),
        evaluationCriteria: q.evaluationCriteria,
        timeAllocation: q.timeAllocation,
        isRequired: q.isRequired,
        order: i,
        categoryId: cultureFitCategory.id,
      },
    });
  }
  console.log('Created culture fit questions');

  // Create app config
  await prisma.appConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      appName: 'AI Recruiting Assistant',
      selectedVoice: 'alloy',
      maxInterviewMins: 60,
      transcriptionEnabled: true,
      autoSummaryEnabled: true,
    },
  });
  console.log('Created app config');

  // ==============================
  // AI AGENTS
  // ==============================
  const aiAgents = [
    {
      id: 'agent-interviewer',
      name: 'Interview Screener',
      description: 'Conducts initial candidate screening interviews',
      systemPrompt: 'You are a professional HR interviewer conducting an initial screening call. Be friendly but professional. Ask questions clearly and listen actively. Provide appropriate follow-up questions based on responses.',
      model: 'gpt-4o-realtime',
      voice: 'alloy',
      temperature: 0.7,
      isActive: true,
    },
    {
      id: 'agent-technical',
      name: 'Technical Assessor',
      description: 'Conducts technical interviews and coding assessments',
      systemPrompt: 'You are a senior technical interviewer. Assess candidates on their technical knowledge, problem-solving ability, and coding skills. Ask clarifying questions and provide hints when appropriate.',
      model: 'gpt-4o-realtime',
      voice: 'echo',
      temperature: 0.5,
      isActive: true,
    },
    {
      id: 'agent-scheduler',
      name: 'Interview Scheduler',
      description: 'Helps candidates schedule and reschedule interviews',
      systemPrompt: 'You are a helpful scheduling assistant. Help candidates find suitable interview times, handle rescheduling requests, and answer questions about the interview process.',
      model: 'gpt-4o',
      voice: 'nova',
      temperature: 0.7,
      isActive: true,
    },
  ];

  for (const agent of aiAgents) {
    await prisma.aIAgent.upsert({
      where: { id: agent.id },
      update: {},
      create: agent,
    });
  }
  console.log('Created AI agents');

  // ==============================
  // AI TOOLS
  // ==============================
  const aiTools = [
    {
      id: 'tool-schedule',
      name: 'schedule_followup',
      description: 'Schedule a follow-up interview with the candidate',
      type: 'function',
      schema: JSON.stringify({
        type: 'object',
        properties: {
          candidateEmail: { type: 'string', description: 'Candidate email address' },
          dateTime: { type: 'string', description: 'Proposed date and time' },
          interviewType: { type: 'string', enum: ['technical', 'behavioral', 'final'] },
        },
        required: ['candidateEmail', 'dateTime', 'interviewType'],
      }),
      isActive: true,
    },
    {
      id: 'tool-lookup',
      name: 'lookup_candidate',
      description: 'Look up candidate information from the database',
      type: 'api',
      schema: JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Candidate email to look up' },
        },
        required: ['email'],
      }),
      endpoint: '/api/candidates/lookup',
      isActive: true,
    },
    {
      id: 'tool-notify',
      name: 'send_notification',
      description: 'Send email or SMS notification to candidate or recruiter',
      type: 'webhook',
      schema: JSON.stringify({
        type: 'object',
        properties: {
          recipient: { type: 'string' },
          channel: { type: 'string', enum: ['email', 'sms'] },
          message: { type: 'string' },
        },
        required: ['recipient', 'channel', 'message'],
      }),
      endpoint: 'https://hooks.example.com/notify',
      isActive: true,
    },
  ];

  for (const tool of aiTools) {
    await prisma.aITool.upsert({
      where: { id: tool.id },
      update: {},
      create: tool,
    });
  }
  console.log('Created AI tools');

//   // ==============================
//   // VOICES
//   // ==============================
//   const voices = [
//     { voiceId: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice', gender: 'neutral', accent: 'American', provider: 'openai', isDefault: true },
//     { voiceId: 'echo', name: 'Echo', description: 'Clear male voice', gender: 'male', accent: 'American', provider: 'openai' },
//     { voiceId: 'fable', name: 'Fable', description: 'British accent voice', gender: 'male', accent: 'British', provider: 'openai' },
//     { voiceId: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice', gender: 'male', accent: 'American', provider: 'openai' },
//     { voiceId: 'nova', name: 'Nova', description: 'Warm female voice', gender: 'female', accent: 'American', provider: 'openai' },
//     { voiceId: 'shimmer', name: 'Shimmer', description: 'Soft, friendly voice', gender: 'female', accent: 'American', provider: 'openai' },
//   ];
// 
//   for (const voice of voices) {
//     await prisma.voice.upsert({
//       where: { voiceId: voice.voiceId },
//       update: {},
//       create: voice,
//     });
//   }

  // ==============================
  // LANGUAGES - All 24 languages (EXACTLY from CLAUDE.md, ALL enabled)
  // ==============================
  const languages = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true },
    { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', enabled: true },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', enabled: true },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', enabled: true },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', enabled: true },
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', enabled: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', enabled: true },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', enabled: true },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
  console.log('Created languages');

  // ==============================
  // WEBHOOKS
  // ==============================
  const webhooks = [
    {
      id: 'webhook-slack',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/EXAMPLE/WEBHOOK',
      events: JSON.stringify(['interview.completed', 'score.generated']),
      secret: 'whsec_example123',
      isActive: true,
    },
    {
      id: 'webhook-ats',
      name: 'ATS Integration',
      url: 'https://ats.example.com/webhooks/recruiting',
      events: JSON.stringify(['interview.created', 'interview.completed', 'candidate.no_show']),
      secret: 'ats_secret_key',
      isActive: true,
    },
  ];

  for (const webhook of webhooks) {
    await prisma.webhook.upsert({
      where: { id: webhook.id },
      update: {},
      create: webhook,
    });
  }
  console.log('Created webhooks');

  // ==============================
  // SMS SETTINGS
  // ==============================
  await prisma.sMSSettings.upsert({
    where: { id: 'sms-default' },
    update: {},
    create: {
      id: 'sms-default',
      provider: 'twilio',
      accountSid: 'AC_EXAMPLE_SID',
      authToken: 'AUTH_TOKEN_EXAMPLE',
      fromNumber: '+15551234567',
      enableReminders: true,
      reminderHours: 24,
      isActive: true,
    },
  });
  console.log('Created SMS settings');

  // ==============================
  // CALL TRANSFER
  // ==============================
  const callTransfers = [
    {
      id: 'transfer-hr',
      name: 'HR Department',
      description: 'Transfer to HR for general inquiries',
      phoneNumber: '+15559876543',
      sipUri: 'sip:hr@company.com',
      priority: 10,
      isActive: true,
    },
    {
      id: 'transfer-recruiter',
      name: 'Lead Recruiter',
      description: 'Transfer to lead recruiter for urgent matters',
      phoneNumber: '+15551112222',
      priority: 20,
      isActive: true,
    },
    {
      id: 'transfer-emergency',
      name: 'Emergency Support',
      description: 'After-hours emergency support line',
      phoneNumber: '+15553334444',
      priority: 5,
      isActive: false,
    },
  ];

  for (const transfer of callTransfers) {
    await prisma.callTransfer.upsert({
      where: { id: transfer.id },
      update: {},
      create: transfer,
    });
  }
  console.log('Created call transfer targets');

  // ==============================
  // DTMF MENU
  // ==============================
  const dtmfMenus = [
    { id: 'dtmf-1', name: 'Repeat Question', digit: '1', action: 'repeat', prompt: 'Press 1 to hear the question again', isActive: true },
    { id: 'dtmf-2', name: 'Skip Question', digit: '2', action: 'skip', prompt: 'Press 2 to skip to the next question', isActive: true },
    { id: 'dtmf-0', name: 'Transfer to Human', digit: '0', action: 'transfer', targetId: 'transfer-hr', prompt: 'Press 0 to speak with a human representative', isActive: true },
    { id: 'dtmf-star', name: 'Pause Interview', digit: '*', action: 'pause', prompt: 'Press star to pause the interview', isActive: true },
    { id: 'dtmf-hash', name: 'End Interview', digit: '#', action: 'end', prompt: 'Press pound to end the interview', isActive: true },
  ];

  for (const menu of dtmfMenus) {
    await prisma.dTMFMenu.upsert({
      where: { id: menu.id },
      update: {},
      create: menu,
    });
  }
  console.log('Created DTMF menu options');

  // ==============================
  // LOGIC RULES
  // ==============================
  const logicRules = [
    {
      id: 'rule-low-score',
      name: 'Low Score Alert',
      description: 'Notify HR when interview score is below threshold',
      trigger: 'score.generated',
      conditions: JSON.stringify([{ field: 'overallScore', operator: '<', value: 3 }]),
      actions: JSON.stringify([{ type: 'email', to: 'hr@company.com', template: 'low_score_alert' }]),
      priority: 10,
      isActive: true,
    },
    {
      id: 'rule-no-show',
      name: 'No Show Follow-up',
      description: 'Automatically reschedule when candidate is a no-show',
      trigger: 'candidate.no_show',
      conditions: JSON.stringify([]),
      actions: JSON.stringify([
        { type: 'email', to: 'candidate', template: 'reschedule_invite' },
        { type: 'sms', to: 'candidate', template: 'no_show_followup' },
      ]),
      priority: 5,
      isActive: true,
    },
    {
      id: 'rule-high-score',
      name: 'Fast Track High Performers',
      description: 'Automatically advance candidates with high scores',
      trigger: 'interview.completed',
      conditions: JSON.stringify([{ field: 'overallScore', operator: '>=', value: 4 }]),
      actions: JSON.stringify([{ type: 'webhook', url: '/api/fast-track', data: { stage: 'final_interview' } }]),
      priority: 15,
      isActive: true,
    },
  ];

  for (const rule of logicRules) {
    await prisma.logicRule.upsert({
      where: { id: rule.id },
      update: {},
      create: rule,
    });
  }
  console.log('Created logic rules');

  // ==============================
  // FUNCTIONS
  // ==============================
  const functions = [
    {
      id: 'fn-score-calc',
      name: 'calculateWeightedScore',
      description: 'Calculate weighted interview score based on category weights',
      code: `function calculateWeightedScore(scores, weights) {
  let total = 0;
  let weightSum = 0;
  for (const category in scores) {
    if (weights[category]) {
      total += scores[category] * weights[category];
      weightSum += weights[category];
    }
  }
  return weightSum > 0 ? total / weightSum : 0;
}`,
      parameters: JSON.stringify([
        { name: 'scores', type: 'object', description: 'Category scores object' },
        { name: 'weights', type: 'object', description: 'Category weights object' },
      ]),
      returnType: 'number',
      isActive: true,
    },
    {
      id: 'fn-format-time',
      name: 'formatInterviewDuration',
      description: 'Format interview duration in human-readable format',
      code: `function formatInterviewDuration(minutes) {
  if (minutes < 60) return minutes + ' minutes';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours + ' hour' + (hours > 1 ? 's' : '') + (mins > 0 ? ' ' + mins + ' min' : '');
}`,
      parameters: JSON.stringify([{ name: 'minutes', type: 'number', description: 'Duration in minutes' }]),
      returnType: 'string',
      isActive: true,
    },
  ];

  for (const fn of functions) {
    await prisma.function.upsert({
      where: { id: fn.id },
      update: {},
      create: fn,
    });
  }
  console.log('Created functions');

  // ==============================
  // PAYMENTS (Sample transactions)
  // ==============================
  const payments = [
    {
      id: 'pay-001',
      amount: 299.00,
      currency: 'USD',
      status: 'completed',
      method: 'card',
      transactionId: 'txn_1234567890',
      description: 'Pro Plan - Monthly',
      companyId: company.id,
    },
    {
      id: 'pay-002',
      amount: 299.00,
      currency: 'USD',
      status: 'completed',
      method: 'card',
      transactionId: 'txn_1234567891',
      description: 'Pro Plan - Monthly',
      companyId: company.id,
    },
    {
      id: 'pay-003',
      amount: 49.00,
      currency: 'USD',
      status: 'completed',
      method: 'paypal',
      transactionId: 'txn_1234567892',
      description: 'Additional Interview Credits (50)',
      companyId: company.id,
    },
    {
      id: 'pay-004',
      amount: 299.00,
      currency: 'USD',
      status: 'pending',
      method: 'bank',
      description: 'Pro Plan - Monthly',
      companyId: company.id,
    },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    });
  }
  console.log('Created sample payments');

  // ==============================
  // SAMPLE INTERVIEWS
  // ==============================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const interviews = [
    {
      id: 'interview-001',
      candidateName: 'John Smith',
      candidateEmail: 'john.smith@example.com',
      candidatePhone: '+15551234567',
      mode: 'HYBRID',
      status: 'SCHEDULED',
      scheduledAt: tomorrow,
      duration: 45,
      notes: 'Strong resume, 5 years experience',
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
    {
      id: 'interview-002',
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.j@example.com',
      candidatePhone: '+15559876543',
      mode: 'AI_ONLY',
      status: 'SCHEDULED',
      scheduledAt: nextWeek,
      duration: 30,
      notes: 'Referral from current employee',
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
    {
      id: 'interview-003',
      candidateName: 'Michael Chen',
      candidateEmail: 'mchen@example.com',
      mode: 'HYBRID',
      status: 'COMPLETED',
      scheduledAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      duration: 60,
      jobRoleId: softwareEngineer.id,
      companyId: company.id,
    },
  ];

  for (const interview of interviews) {
    await prisma.interview.upsert({
      where: { id: interview.id },
      update: {},
      create: interview,
    });
  }

  // Add result for completed interview
  await prisma.interviewResult.upsert({
    where: { interviewId: 'interview-003' },
    update: {},
    create: {
      interviewId: 'interview-003',
      transcript: 'Full transcript of the interview...',
      summary: 'Strong technical skills, excellent communication. Demonstrated deep knowledge of system design and practical experience with microservices architecture.',
      scorecard: JSON.stringify({
        technical: 4,
        behavioral: 5,
        cultureFit: 4,
      }),
      managerNotes: 'Recommend moving to final round',
      overallScore: 4,
      recommendation: 'YES',
    },
  });
  console.log('Created sample interviews');

  // ==============================
  // BRANDING - Teal theme
  // ==============================
  await prisma.branding.upsert({
    where: { id: 'default-branding' },
    update: {},
    create: {
      id: 'default-branding',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0d9488',
      secondaryColor: '#0f766e',
      accentColor: '#14b8a6',
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
  });
  console.log('Created branding');

  // ==============================
  // STORE INFO
  // ==============================
  await prisma.storeInfo.upsert({
    where: { id: 'default-storeinfo' },
    update: {},
    create: {
      id: 'default-storeinfo',
      businessName: 'AI Recruiting Assistant',
      tagline: 'Smart Hiring Made Simple',
      description: 'AI-powered recruiting and interview platform',
      address: '',
      phone: '',
      email: '',
      website: '',
      businessHours: '',
      timezone: 'America/New_York',
    },
  });
  console.log('Created store info');

  // ==============================
  // FEATURES
  // ==============================
  await prisma.features.upsert({
    where: { id: 'default-features' },
    update: {},
    create: {
      id: 'default-features',
      faqEnabled: false,
      stickyBarEnabled: false,
      stickyBarText: '',
      stickyBarBgColor: '#0d9488',
      liveChatEnabled: false,
      chatProvider: 'builtin',
      chatWelcomeMessage: 'Hi! How can we help you today?',
      chatAgentName: 'Support',
      chatWidgetColor: '#0d9488',
      chatPosition: 'bottom-right',
      chatShowOnMobile: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      orderConfirmations: true,
      marketingEmails: false,
      appointmentReminders: true,
    },
  });
  console.log('Created features');

  // ==============================
  // PAYMENT SETTINGS
  // ==============================
  await prisma.paymentSettings.upsert({
    where: { id: 'default-payments' },
    update: {},
    create: {
      id: 'default-payments',
      enabled: false,
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeTestMode: true,
      paypalEnabled: false,
      paypalClientId: '',
      paypalSandbox: true,
      squareEnabled: false,
      squareAppId: '',
      squareSandbox: true,
    },
  });
  console.log('Created payment settings');

  console.log('\n✅ Database seeded successfully!');
  // =====================
  // PAYMENT GATEWAYS
  // =====================
  const paymentGateways = [
    { provider: 'stripe', isEnabled: true, testMode: true },
    { provider: 'paypal', isEnabled: false, testMode: true },
    { provider: 'braintree', isEnabled: false, testMode: true },
    { provider: 'square', isEnabled: false, testMode: true },
    { provider: 'authorize', isEnabled: false, testMode: true }
  ];

  for (const gateway of paymentGateways) {
    await prisma.paymentGateway.upsert({
      where: { provider: gateway.provider },
      update: {},
      create: gateway
    });
  }
  console.log('Payment gateways seeded');

  // =====================
  // SUBSCRIPTION PLANS
  // =====================
  const subscriptionPlans = [
    { code: 'free', name: 'Free Trial', description: '3 interviews/month, basic features', price: 0, billingPeriod: 'monthly', features: 'Basic features,3 interviews/month,Email support', isActive: true },
    { code: 'nonprofit', name: 'Non-Profit', description: '50 interviews/month, email support', price: 9.99, billingPeriod: 'monthly', features: '50 interviews/month,Email support,Basic analytics', isActive: true },
    { code: 'professional', name: 'Professional', description: '200 interviews/month, priority support, analytics', price: 29.99, billingPeriod: 'monthly', features: '200 interviews/month,Priority support,Advanced analytics,Custom branding', isActive: true },
    { code: 'premium', name: 'Premium', description: 'Unlimited interviews, dedicated support, API access', price: 59.00, billingPeriod: 'monthly', features: 'Unlimited interviews,Dedicated support,API access,Custom integrations,White-label option', isActive: true }
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {},
      create: plan
    });
  }
  console.log('Subscription plans seeded');

  console.log('\n📋 Login credentials:');
  console.log('═══════════════════════════════════════════════');
  console.log('🛡️  SUPER ADMIN (Platform-wide access)');
  console.log('    Email: superadmin@system.local');
  console.log('    Password: superadmin123');
  console.log('───────────────────────────────────────────────');
  console.log('👔 COMPANY ADMIN (Company-level full control)');
  console.log('    Email: admin@demo.local');
  console.log('    Password: admin123');
  console.log('───────────────────────────────────────────────');
  console.log('📋 MANAGER (Interview management)');
  console.log('    Email: manager@demo.local');
  console.log('    Password: manager123');
  console.log('───────────────────────────────────────────────');
  console.log('👁️  SUPERVISOR (View sessions/analytics)');
  console.log('    Email: supervisor@demo.local');
  console.log('    Password: supervisor123');
  console.log('───────────────────────────────────────────────');
  console.log('🎯 CANDIDATE (Own interviews only)');
  console.log('    Email: candidate@demo.local');
  console.log('    Password: candidate123');
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
