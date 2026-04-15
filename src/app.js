const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Custom sanitizer (express-mongo-sanitize is incompatible with Express 5)
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  }
  return obj;
};
const mongoSanitize = () => (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
};
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');
const islandRoutes = require('./routes/islandRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const errorHandler = require('./middleware/error');

const app = express();

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Explore Indian Island API',
      version: '1.0.0',
      description: 'API documentation for the Island discovery platform',
    },
    servers: [{ url: 'http://localhost:5001' }],
  },
  apis: [path.join(__dirname, 'routes/*.js')],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Rate Limiter — max 20 requests per 10 minutes for auth routes
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests, please try again after 10 minutes' }
});

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174,https://exploreindianislands.vercel.app')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(morgan('tiny'));
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Documentation Route
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running smoothly' });
});

// API Routes
app.use('/api/islands', islandRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);

// 404 Handler (for undefined routes)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error Handler (Must be last middleware)
app.use(errorHandler);

module.exports = app;
