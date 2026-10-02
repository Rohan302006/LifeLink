import { app } from './app.js';
import { config } from './config/env.js';
import { startEscalationWorker } from './services/escalationWorker.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`
=============================================================
  ❤️  LifeLink Verified Coordination Platform — Backend
=============================================================
  Port:           ${PORT}
  Environment:    ${config.nodeEnv}
  Database:       ${config.databaseUrl ? 'PostgreSQL/NeonDB' : 'High-Speed Local InMemory SQL Engine (Active)'}
  Gemini AI:      ${config.geminiApiKey ? 'Connected (Gemini 1.5 Flash)' : 'Intelligent Local Multi-Language Fallback (Active)'}
  OTP Service:    Mock/SMS Adapter (Preview enabled for demo)
=============================================================
`);

  // Start background escalation worker (checks every 60s)
  startEscalationWorker(60000);
});

export default server;
