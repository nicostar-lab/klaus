const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReservation,
  getMyReservations,
  getReservationById,
  cancelReservation,
  getTrajetReservations,
  confirmReservation,
  completeReservation
} = require('../controllers/reservationController');

/**
 * ROUTES RÉSERVATIONS
 * 
 * Toutes les routes nécessitent une authentification
 * 
 * Routes :
 *   - POST   /api/reservations                    → Créer une réservation
 *   - GET    /api/reservations                    → Mes réservations
 *   - GET    /api/reservations/:id                → Détails d'une réservation
 *   - DELETE /api/reservations/:id                → Annuler une réservation
 *   - GET    /api/reservations/trajet/:trajetId   → Réservations d'un trajet (conducteur)
 *   - PUT    /api/reservations/:id/confirm        → Confirmer une réservation (conducteur)
 *   - PUT    /api/reservations/:id/complete       → Marquer comme terminée
 */

router.post('/', protect, createReservation);
router.get('/', protect, getMyReservations);
router.get('/trajet/:trajetId', protect, getTrajetReservations);
router.get('/:id', protect, getReservationById);
router.delete('/:id', protect, cancelReservation);
router.put('/:id/confirm', protect, confirmReservation);
router.put('/:id/complete', protect, completeReservation);

module.exports = router;