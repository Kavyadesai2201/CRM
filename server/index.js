// /server/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Route imports
import authRoutes     from './routes/auth.js';
import leadRoutes     from './routes/leads.js';
import pipelineRoutes from './routes/pipeline.js';
import analyticsRoutes from './routes/analytics.js';
import whatsappRoutes from './routes/whatsapp.js';
import instagramRoutes from './routes/instagram.js';
import webhookRoutes  from './routes/webhooks.js';    // unified Meta webhooks
import notesRoutes    from './routes/notes.js';
import messagesRoutes from './routes/messages.js';
import streamRoutes   from './routes/stream.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CRM API',
    version: '1.0.0',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/leads',     leadRoutes);
app.use('/api/notes',     notesRoutes);
app.use('/api/messages',  messagesRoutes);
app.use('/api/stream',    streamRoutes);
app.use('/api/pipeline',  pipelineRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whatsapp',  whatsappRoutes);    // POST /api/whatsapp/send
app.use('/api/instagram', instagramRoutes);   // legacy reply route kept
app.use('/api/webhooks',  webhookRoutes);     // GET+POST /api/webhooks/whatsapp|instagram

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on http://localhost:${PORT}`);
});

export default app;
