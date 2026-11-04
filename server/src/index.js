import { app } from './app.js';
import { config } from './config/env.js';
import { initDatabase, db } from './db/database.js';
import { runSeed } from './seeds/seed.js';

const PORT = config.port;

async function startServer() {
  // Initialize database connection (PostgreSQL / NeonDB or in-memory fallback)
  await initDatabase();

  const server = app.listen(PORT, async () => {
    console.log(`
=============================================================
  LifeLink Verified Emergency Coordination Backend
=============================================================
  Port:           ${PORT}
  Environment:    ${config.nodeEnv}
  Database:       ${db.isPg() ? 'PostgreSQL (NeonDB Connected)' : 'Memory DB Engine (Active)'}
  File Storage:   Private (uploads/private)
  Roles:          DONOR, RECEIVER, DOCTOR, ADMIN
=============================================================
`);

    // Auto-seed default accounts on server boot
    try {
      await runSeed();
    } catch (err) {
      console.warn('⚠️ Auto-seed warning:', err.message);
    }
  });

  return server;
}

const server = await startServer();
export default server;
