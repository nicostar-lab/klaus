const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const initializeSocket = require('./Services/socketHandler');
const evaluationRoutes = require('./routes/evaluationRoutes');

// Charger les variables d'environnement
dotenv.config();

// Valider les variables d'environnement requises
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Configuration Socket.io avec CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialiser Socket.io
initializeSocket(io);

// Rendre io accessible dans les routes
app.set('io', io);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: ' API Covoiturage Universitaire',
    version: '2.0.0',
    status: 'Opérationnel',
    features: {
      auth: 'Authentification JWT',
      trajets: 'Gestion des trajets',
      reservations: 'Système de réservation',
      evaluations: 'Système d\'évaluation',
      messages: 'Messagerie temps réel',
      upload: 'Upload de photos'
    },
    endpoints: {
      auth: '/api/auth',
      trajets: '/api/trajets',
      reservations: '/api/reservations',
      evaluations: '/api/evaluations',
      messages: '/api/messages',
      upload: '/api/upload'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trajets', require('./routes/trajetRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes')); 
app.use('/api/notifications', require('./routes/notificationRoutes'));


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Erreur globale:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log(' SERVEUR DÉMARRÉ');
  console.log('========================================');
  console.log(` Port          : ${PORT}`);
  console.log(`Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL           : http://localhost:${PORT}`);
  console.log(` API Docs      : http://localhost:${PORT}/`);
  console.log(` WebSocket     : Activé`);
  console.log('========================================\n');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('\n⚠️  Signal SIGTERM reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Signal SIGINT reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(' ERREUR NON GÉRÉE (Promise Rejection):');
  console.error(err);
  
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(' ERREUR NON CAPTURÉE (Exception):');
  console.error(err);
  
  process.exit(1);
});

module.exports = app;