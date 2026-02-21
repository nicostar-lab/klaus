const Reservation = require('../models/Reservation');
const Trajet = require('../models/Trajet');

/**
 * @desc    Créer une nouvelle réservation
 * @route   POST /api/reservations
 * @access  Private
 */
exports.createReservation = async (req, res) => {
  try {
    const { trajet, nb_places, notes } = req.body;

    // Validation
    if (!trajet || !nb_places) {
      return res.status(400).json({
        success: false,
        message: 'Le trajet et le nombre de places sont obligatoires'
      });
    }

    // Vérifier que le trajet existe
    const trajetDoc = await Trajet.findById(trajet);

    if (!trajetDoc) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé'
      });
    }

    // Vérifier que l'utilisateur n'est pas le conducteur
    if (trajetDoc.conducteur.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas réserver votre propre trajet'
      });
    }

    // Vérifier que l'utilisateur n'a pas déjà réservé ce trajet
    const existingReservation = await Reservation.userHasReserved(req.user.id, trajet);

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une réservation pour ce trajet'
      });
    }

    // Vérifier la disponibilité des places
    if (!trajetDoc.hasAvailableSeats(nb_places)) {
      return res.status(400).json({
        success: false,
        message: 'Pas assez de places disponibles'
      });
    }

    // Créer la réservation
    const reservation = await Reservation.create({
      trajet,
      passager: req.user.id,
      nb_places,
      notes
    });

    // Peupler les données
    await reservation.populate([
      { path: 'trajet' },
      { path: 'passager', select: 'nom prenom photo telephone' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      reservation
    });

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir toutes les réservations de l'utilisateur
 * @route   GET /api/reservations
 * @access  Private
 */
exports.getMyReservations = async (req, res) => {
  try {
    const { statut } = req.query;

    const reservations = await Reservation.getUserReservations(req.user.id, statut);

    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir une réservation par ID
 * @route   GET /api/reservations/:id
 * @access  Private
 */
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('trajet')
      .populate({
        path: 'trajet',
        populate: {
          path: 'conducteur',
          select: 'nom prenom photo telephone note_moyenne'
        }
      })
      .populate('passager', 'nom prenom photo telephone');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le passager ou le conducteur
    const isConducteur = reservation.trajet.conducteur._id.toString() === req.user.id;
    const isPassager = reservation.passager._id.toString() === req.user.id;

    if (!isConducteur && !isPassager) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    res.status(200).json({
      success: true,
      reservation
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Annuler une réservation
 * @route   DELETE /api/reservations/:id
 * @access  Private
 */
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le passager
    if (reservation.passager.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé - Vous n\'êtes pas le propriétaire de cette réservation'
      });
    }

    // Vérifier si l'annulation est possible
    const canCancel = await reservation.canBeCancelled();

    if (!canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut plus être annulée (moins de 24h avant le départ)'
      });
    }

    // Annuler la réservation
    await reservation.cancel();

    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les réservations d'un trajet (pour le conducteur)
 * @route   GET /api/reservations/trajet/:trajetId
 * @access  Private (conducteur uniquement)
 */
exports.getTrajetReservations = async (req, res) => {
  try {
    const trajet = await Trajet.findById(req.params.trajetId);

    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (trajet.conducteur.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé - Vous n\'êtes pas le conducteur de ce trajet'
      });
    }

    const reservations = await Reservation.getTrajetReservations(req.params.trajetId);

    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Confirmer une réservation (pour le conducteur)
 * @route   PUT /api/reservations/:id/confirm
 * @access  Private (conducteur uniquement)
 */
exports.confirmReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('trajet');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (reservation.trajet.conducteur.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (reservation.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation n\'est pas en attente'
      });
    }

    reservation.statut = 'confirmee';
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Réservation confirmée avec succès',
      reservation
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Marquer une réservation comme terminée
 * @route   PUT /api/reservations/:id/complete
 * @access  Private
 */
exports.completeReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('trajet');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le conducteur ou le passager
    const isConducteur = reservation.trajet.conducteur.toString() === req.user.id;
    const isPassager = reservation.passager.toString() === req.user.id;

    if (!isConducteur && !isPassager) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await reservation.complete();

    res.status(200).json({
      success: true,
      message: 'Réservation marquée comme terminée',
      reservation
    });

  } catch (error) {
    console.error('Erreur lors de la complétion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};