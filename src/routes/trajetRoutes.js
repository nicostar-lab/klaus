const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createTrajet, updateRetard } = require('../controllers/trajetController');

router.post('/', protect, createTrajet);
router.put('/:id/retard', protect, updateRetard);

module.exports = router;
