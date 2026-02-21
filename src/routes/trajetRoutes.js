const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTrajet,
  getTrajets,
  getTrajetById,
  updateTrajet,
  deleteTrajet,
  getMyTrajets,
  updateRetard,
  searchTrajets
} = require('../controllers/trajetController');

/**
 * ROUTES TRAJETS
 * 
 * Routes publiques :
 *   - GET /api/trajets          → Liste des trajets
 *   - GET /api/trajets/search   → Rechercher des trajets
 *   - GET /api/trajets/:id      → Détails d'un trajet
 * 
 * Routes protégées :
 *   - POST   /api/trajets           → Créer un trajet
 *   - GET    /api/trajets/user/me   → Mes trajets
 *   - PUT    /api/trajets/:id       → Modifier un trajet
 *   - DELETE /api/trajets/:id       → Supprimer un trajet
 *   - PUT    /api/trajets/:id/retard → Signaler un retard
 */

// Routes publiques
router.get('/search', searchTrajets);
router.get('/', getTrajets);
router.get('/:id', getTrajetById);

// Routes protégées
router.post('/', protect, createTrajet);
router.get('/user/me', protect, getMyTrajets);
router.put('/:id', protect, updateTrajet);
router.delete('/:id', protect, deleteTrajet);
router.put('/:id/retard', protect, updateRetard);

module.exports = router;