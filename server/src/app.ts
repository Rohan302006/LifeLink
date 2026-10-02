import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import bloodRequestRoutes from './routes/bloodRequestRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import organRoutes from './routes/organRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import { emailAdapter } from './services/emailAdapter.js';

export const app = express();

// Security and CORS
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'LifeLink Verified Coordination Platform',
    timestamp: new Date().toISOString(),
    mode: 'verified_coordination_only',
  });
});

// Notifications endpoint
app.get('/api/notifications/recent', (req, res) => {
  const emails = emailAdapter.getRecentSentEmails(15);
  res.json({ emails });
});

// Route mountings
app.use('/api/auth', authRoutes);
app.use('/api/requests', bloodRequestRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/organ', organRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});
