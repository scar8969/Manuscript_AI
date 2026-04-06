require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Startup validation ---
const requiredEnvVars = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'DATABASE_URL'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy backend/.env.example to backend/.env and fill in all values.');
  process.exit(1);
}

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // CSP handled by reverse proxy / Vercel headers
  crossOriginEmbedderPolicy: false
}));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com", "https://*.googleusercontent.com"],
    frameSrc: ["'self'", "blob:"],
    connectSrc: ["'self'", "https://openrouter.ai"]
  }
}));

// CORS — restrictive, configurable via ALLOWED_ORIGIN
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } }
});
app.use('/api', limiter);

// Routes
const authMiddleware = require('./middleware/auth');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/compile', require('./routes/compile'));
app.use('/api/ai-edit', require('./routes/aiEdit'));
app.use('/api/scrape', require('./routes/scrape'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/templates', require('./routes/templates'));

// Health check
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try {
    const prisma = require('./prisma');
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  res.json({
    ok: dbOk,
    version: '1.0.0',
    db: dbOk ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Temp file cleanup — every 30 min, delete files older than 1 hour
const { cleanupOldFiles } = require('./utils/fileManager');
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL_MS || 1800000);
const TEMP_MAX_AGE = parseInt(process.env.TEMP_MAX_AGE_MS || 3600000);

const cleanupTimer = setInterval(() => {
  try {
    cleanupOldFiles(TEMP_MAX_AGE);
  } catch (err) {
    console.error('[cleanup] Error:', err.message);
  }
}, CLEANUP_INTERVAL);

// Clean up expired sessions (every 30 minutes)
const prisma = require('./prisma');
setInterval(async () => {
  try {
    await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  } catch (err) {
    console.error('[cleanup] Session cleanup error:', err.message);
  }
}, 30 * 60 * 1000);

// --- Graceful shutdown ---
const server = app.listen(PORT, () => {
  console.log(`[manuscript-ai] Server running on port ${PORT} (${process.env.NODE_ENV})`);
});

const shutdown = (signal) => {
  console.log(`[manuscript-ai] ${signal} received, shutting down...`);
  clearInterval(cleanupTimer);
  server.close(() => {
    const prisma = require('./prisma');
    prisma.$disconnect().then(() => {
      console.log('[manuscript-ai] Graceful shutdown complete');
      process.exit(0);
    });
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[error] Unhandled:', err.stack || err.message);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
});

module.exports = app;
