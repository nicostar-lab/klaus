const Evaluation = require('../models/Evaluation');
const Reservation = require('../models/Reservation');

/**
 * @desc    Créer une évaluation
 * @route   POST /api/evaluations
 * @access  Private
 */
exports.createEvaluation = async (req, res) => {
  try {
    const { reservation, note, commentaire, ponctualite, conduite, communication } = req.body;

    // Validation
    if (!reservation || !note) {
      return res.status(400).json({
        success: false,
        message: 'La réservation et la note sont obligatoires'
      });
    }

    // Vérifier si l'utilisateur peut évaluer
    const checkResult = await Evaluation.canEvaluate(req.user.id, reservation);

    if (!checkResult.canEvaluate) {
      return res.status(400).json({
        success: false,
        message: checkResult.message
      });
    }

    // Récupérer la réservation pour obtenir le trajet
    const reservationDoc = await Reservation.findById(reservation).populate('trajet');

    // Créer l'évaluation
    const evaluation = await Evaluation.create({
      trajet: reservationDoc.trajet._id,
      reservation,
      evaluateur: req.user.id,
      evalue: checkResult.evalueTo,
      note,
      commentaire,
      ponctualite,
      conduite,
      communication
    });

    await evaluation.populate([
      { path: 'evaluateur', select: 'nom prenom photo' },
      { path: 'evalue', select: 'nom prenom photo' },
      { path: 'trajet', select: 'ville_depart ville_arrivee date_depart' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Évaluation créée avec succès',
      evaluation
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'évaluation:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà évalué ce trajet'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'évaluation',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les évaluations d'un utilisateur
 * @route   GET /api/evaluations/user/:userId
 * @access  Public
 */
exports.getUserEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.getUserEvaluations(req.params.userId);

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir mes évaluations reçues
 * @route   GET /api/evaluations/me
 * @access  Private
 */
exports.getMyEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.getUserEvaluations(req.user.id);

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les évaluations que j'ai données
 * @route   GET /api/evaluations/given
 * @access  Private
 */
exports.getGivenEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.getEvaluationsBy(req.user.id);

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Vérifier si je peux évaluer une réservation
 * @route   GET /api/evaluations/can-evaluate/:reservationId
 * @access  Private
 */
exports.canEvaluate = async (req, res) => {
  try {
    const result = await Evaluation.canEvaluate(req.user.id, req.params.reservationId);

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Modifier une évaluation
 * @route   PUT /api/evaluations/:id
 * @access  Private
 */
exports.updateEvaluation = async (req, res) => {
  try {
    let evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est l'évaluateur
    if (evaluation.evaluateur.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Mettre à jour
    const { note, commentaire, ponctualite, conduite, communication } = req.body;
    
    evaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      { note, commentaire, ponctualite, conduite, communication },
      { new: true, runValidators: true }
    ).populate([
      { path: 'evaluateur', select: 'nom prenom photo' },
      { path: 'evalue', select: 'nom prenom photo' },
      { path: 'trajet', select: 'ville_depart ville_arrivee date_depart' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Évaluation mise à jour avec succès',
      evaluation
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer une évaluation
 * @route   DELETE /api/evaluations/:id
 * @access  Private
 */
exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est l'évaluateur
    if (evaluation.evaluateur.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Marquer comme non visible plutôt que supprimer
    evaluation.visible = false;
    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Évaluation supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};