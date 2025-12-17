// Main server file - handles all the backend setup
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config(); // Load environment variables

// Critical: Ensure JWT_SECRET is set to prevent security vulnerabilities
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required!');
  console.error('💡 Add JWT_SECRET to your .env file before starting the server.');
  process.exit(1);
}

const app = express();

// Security: Set various HTTP headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Security: Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Apply general rate limiter to all routes
app.use('/api/', limiter);

// CORS setup - needed for frontend to talk to backend
app.use(cors({
  origin: [
    'http://localhost:3500',
    'http://localhost:5000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Data sanitization against NoSQL injection (Express 5 compatible)
app.use(mongoSanitize({ replaceWith: '_' }));

// Security: Prevent HTTP Parameter Pollution
app.use(hpp());

// Request logging for debugging
app.use(morgan('dev'));

// Security: Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Let users access uploaded files (avatars, etc)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Running in development mode');
  console.log('📡 PORT:', process.env.PORT || 8000);
}

// Connect to MongoDB Atlas (or local if no env var set)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maintenance-app';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Database:', mongoose.connection.name);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('💡 Make sure MongoDB is running or check your connection string');
  });

// Authentication & user management (with stricter rate limiting)
const authRoutes = require('./routes/auth');
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

// Core maintenance tracking
const maintenanceRoutes = require('./routes/maintenance');
app.use('/api/maintenance', maintenanceRoutes);

// Machine management
const machinesRoutes = require('./routes/machines');
app.use('/api/machines', machinesRoutes);

const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

const requisitionsRoutes = require('./routes/requisitions');
app.use('/api/requisitions', requisitionsRoutes);

const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

const sitesRoutes = require('./routes/sites');
app.use('/api/sites', sitesRoutes);

const productionReportsRoutes = require('./routes/production-reports');
app.use('/api/production-reports', productionReportsRoutes);

const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint for Render and monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Maintenance Tracking API' });
});

// Start the background job scheduler for maintenance reminders
const schedulerService = require('./services/schedulerService');
schedulerService.init();

// Catch-all error handler - this runs if something breaks
app.use((err, req, res, next) => {
  console.error('💥 Error occurred:', err.message);
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong on our end. We\'re looking into it!' 
    : err.message;
  
  res.status(err.status || 500).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server is up and running!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n💡 Press Ctrl+C to stop\n`);
});