const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  updatePassword
} = require('../controllers/authController');

/**
 * ROUTES D'AUTHENTIFICATION
 * 
 * Toutes les routes commencent par /api/auth
 * 
 * Routes publiques (pas besoin d'être connecté) :
 *   - POST /api/auth/register    → S'inscrire
 *   - POST /api/auth/login       → Se connecter
 * 
 * Routes protégées (nécessitent un token) :
 *   - GET  /api/auth/me          → Obtenir son profil
 *   - PUT  /api/auth/update-password → Changer son mot de passe
 */

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 * 
 * Body attendu :
 * {
 *   "nom": "Dupont",
 *   "prenom": "Jean",
 *   "email": "jean.dupont@example.com",
 *   "password": "motdepasse123",
 *   "telephone": "0612345678"
 * }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 * 
 * Body attendu :
 * {
 *   "email": "jean.dupont@example.com",
 *   "password": "motdepasse123"
 * }
 * 
 * Réponse :
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": { ... }
 * }
 */
router.post('/login', login);

// ============================================
// ROUTES PROTÉGÉES (nécessitent un token)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 * 
 * Headers requis :
 *   Authorization: Bearer <token>
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/update-password
 * @desc    Mettre à jour le mot de passe
 * @access  Private
 * 
 * Body attendu :
 * {
 *   "currentPassword": "ancien_mot_de_passe",
 *   "newPassword": "nouveau_mot_de_passe"
 * }
 */
router.put('/update-password', protect, updatePassword);

module.exports = router;
