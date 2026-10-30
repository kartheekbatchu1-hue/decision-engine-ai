import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { generalLimiter, aiLimiter } from './middleware/rateLimiter.js';
import decisionRoutes from './routes/decisionRoutes.js';
import { initializeDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// CORS — allow Vercel deployments, configured FRONTEND_URL, and local dev
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', generalLimiter);

// Root info endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'DecisionEngine AI API',
    status: 'online',
    version: '1.0.0',
    frontend: 'http://localhost:5173',
    message: 'Backend API is running. Open http://localhost:5173 in your browser to access the DecisionEngine UI.',
    endpoints: {
      health: '/health',
      decisions: '/api/decisions',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'DecisionEngine AI Backend',
  });
});

// Routes (supporting both /api/decisions and /decisions)
app.use('/api/decisions', decisionRoutes);
app.use('/decisions', decisionRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

async function bootstrap() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    if (supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT_REF')) {
      await initializeDatabase();
    } else {
      console.log('⚠️  SUPABASE_URL not configured. Update backend/.env with your Supabase project details.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 DecisionEngine AI Backend → http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

