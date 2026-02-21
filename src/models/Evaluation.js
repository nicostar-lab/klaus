const mongoose = require('mongoose');

/**
 * SCHÉMA ÉVALUATION
 * Permet aux utilisateurs de s'évaluer mutuellement après un trajet
 */
const evaluationSchema = new mongoose.Schema({
  // Trajet concerné
  trajet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trajet',
    required: [true, 'Le trajet est obligatoire']
  },

  // Réservation concernée
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'La réservation est obligatoire']
  },

  // Qui évalue
  evaluateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'évaluateur est obligatoire']
  },

  // Qui est évalué
  evalue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur évalué est obligatoire']
  },

  // Note de 1 à 5
  note: {
    type: Number,
    required: [true, 'La note est obligatoire'],
    min: [1, 'La note minimale est 1'],
    max: [5, 'La note maximale est 5']
  },

  // Commentaire (optionnel)
  commentaire: {
    type: String,
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères'],
    trim: true
  },

  // Critères d'évaluation (optionnel)
  ponctualite: {
    type: Number,
    min: 1,
    max: 5
  },

  conduite: {
    type: Number,
    min: 1,
    max: 5
  },

  communication: {
    type: Number,
    min: 1,
    max: 5
  },

  // Statut de l'évaluation
  visible: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

/**
 * Index pour éviter les doublons
 * Un utilisateur ne peut évaluer qu'une fois par réservation
 */
evaluationSchema.index({ reservation: 1, evaluateur: 1 }, { unique: true });

/**
 * Index pour recherche rapide
 */
evaluationSchema.index({ evalue: 1 });
evaluationSchema.index({ trajet: 1 });

/**
 * Après la création d'une évaluation, mettre à jour la note moyenne de l'utilisateur évalué
 */
evaluationSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    const Evaluation = mongoose.model('Evaluation');

    // Calculer la nouvelle note moyenne
    const evaluations = await Evaluation.find({ 
      evalue: doc.evalue,
      visible: true 
    });

    if (evaluations.length > 0) {
      const totalNote = evaluations.reduce((sum, evaluation) => sum + evaluation.note, 0);
      const moyenneNote = totalNote / evaluations.length;

      // Mettre à jour l'utilisateur
      await User.findByIdAndUpdate(doc.evalue, {
        note_moyenne: moyenneNote,
        nb_evaluations: evaluations.length
      });
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
  }
});

/**
 * Vérifier si un utilisateur peut évaluer
 * - Le trajet doit être terminé
 * - L'utilisateur doit être soit le conducteur soit un passager
 */
evaluationSchema.statics.canEvaluate = async function(userId, reservationId) {
  const Reservation = mongoose.model('Reservation');
  const Trajet = mongoose.model('Trajet');

  const reservation = await Reservation.findById(reservationId).populate('trajet');
  
  if (!reservation) {
    return { canEvaluate: false, message: 'Réservation introuvable' };
  }

  if (reservation.statut !== 'terminee') {
    return { canEvaluate: false, message: 'Le trajet doit être terminé' };
  }

  const trajet = reservation.trajet;
  const isConducteur = trajet.conducteur.toString() === userId.toString();
  const isPassager = reservation.passager.toString() === userId.toString();

  if (!isConducteur && !isPassager) {
    return { canEvaluate: false, message: 'Vous n\'êtes pas concerné par ce trajet' };
  }

  // Vérifier si l'évaluation existe déjà
  const existingEval = await this.findOne({
    reservation: reservationId,
    evaluateur: userId
  });

  if (existingEval) {
    return { canEvaluate: false, message: 'Vous avez déjà évalué ce trajet' };
  }

  // Déterminer qui doit être évalué
  const evalueTo = isConducteur ? reservation.passager : trajet.conducteur;

  return { 
    canEvaluate: true, 
    evalueTo,
    isConducteur
  };
};

/**
 * Obtenir les évaluations d'un utilisateur
 */
evaluationSchema.statics.getUserEvaluations = async function(userId) {
  return await this.find({ 
    evalue: userId,
    visible: true 
  })
    .populate('evaluateur', 'nom prenom photo')
    .populate('trajet', 'ville_depart ville_arrivee date_depart')
    .sort({ createdAt: -1 });
};

/**
 * Obtenir les évaluations données par un utilisateur
 */
evaluationSchema.statics.getEvaluationsBy = async function(userId) {
  return await this.find({ 
    evaluateur: userId 
  })
    .populate('evalue', 'nom prenom photo')
    .populate('trajet', 'ville_depart ville_arrivee date_depart')
    .sort({ createdAt: -1 });
};

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;