const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createEvaluation,
  getUserEvaluations,
  getMyEvaluations,
  getGivenEvaluations,
  canEvaluate,
  updateEvaluation,
  deleteEvaluation
} = require('../controllers/evaluationController');

/**
 * ROUTES ÉVALUATIONS
 * 
 * Toutes les routes nécessitent une authentification
 */

// Routes principales
router.post('/', protect, createEvaluation);
router.get('/me', protect, getMyEvaluations);
router.get('/given', protect, getGivenEvaluations);
router.get('/can-evaluate/:reservationId', protect, canEvaluate);
router.get('/user/:userId', getUserEvaluations);
router.put('/:id', protect, updateEvaluation);
router.delete('/:id', protect, deleteEvaluation);

module.exports = router;