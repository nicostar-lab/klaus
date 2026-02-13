
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Charger les variables d'environnement depuis .env
dotenv.config();

const app = express();



app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));


app.use(express.json());


app.use(express.urlencoded({ extended: true }));


if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}




app.get('/', (req, res) => {
  res.json({
    message: ' API Covoiturage Universitaire',
    version: '1.0.0',
    status: 'En cours de développement',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      trajets: '/api/trajets',
      reservations: '/api/reservations',
      evaluations: '/api/evaluations'
    }
  });
});


app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.use('/api/auth', require('./routes/authRoutes'));


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

/**
 * Gestionnaire d'erreurs global
 * Capture toutes les erreurs non gérées
 */
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(' SERVEUR DÉMARRÉ');
  console.log('========================================');
  console.log(` Port          : ${PORT}`);
  console.log(` Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL           : http://localhost:${PORT}`);
  console.log(` API Docs      : http://localhost:${PORT}/`);
  console.log('========================================\n');
});

process.on('SIGTERM', () => {
  console.log('\n Signal SIGTERM reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n Signal SIGINT reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit(0);
  });
});

/**
 * Gérer les erreurs non capturées
 */
process.on('unhandledRejection', (err) => {
  console.error(' ERREUR NON GÉRÉE (Promise Rejection):');
  console.error(err);
  
  // Fermer le serveur et arrêter le processus
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(' ERREUR NON CAPTURÉE (Exception):');
  console.error(err);
  
  // Arrêter le processus
  process.exit(1);
});

module.exports = app;
