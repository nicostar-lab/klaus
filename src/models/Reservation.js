const mongoose = require('mongoose');



const reservationSchema = new mongoose.Schema({
  // Trajet réservé
  trajet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trajet',
    required: [true, 'Le trajet est obligatoire']
  },
  
  // Passager qui réserve
  passager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le passager est obligatoire']
  },
  
  // Nombre de places réservées
  nb_places: {
    type: Number,
    required: [true, 'Le nombre de places est obligatoire'],
    min: [1, 'Il faut réserver au moins 1 place'],
    max: [4, 'Maximum 4 places par réservation'],
    default: 1
  },
  
  // Statut de la réservation
  statut: {
    type: String,
    enum: {
      values: ['en_attente', 'confirmee', 'annulee', 'terminee'],
      message: 'Statut invalide'
    },
    default: 'confirmee'
  },
  
  // Montant total à payer

  montant_total: {
    type: Number,
    required: [true, 'Le montant est obligatoire'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  
  // Date de la réservation

  date_reservation: {
    type: Date,
    default: Date.now
  },
  
  // Notes/commentaires du passager

  notes: {
    type: String,
    maxlength: [200, 'Les notes ne peuvent pas dépasser 200 caractères']
  }
  
}, {
  timestamps: true
});


  // Si c'est une nouvelle réservation et que le montant n'est pas défini

reservationSchema.pre('save', async function(next) {
  if (this.isNew && !this.montant_total) {
    try {
      
      // Récupérer le trajet pour obtenir le prix
      const Trajet = mongoose.model('Trajet');
      const trajet = await Trajet.findById(this.trajet);
      
      if (!trajet) {
        return next(new Error('Trajet introuvable'));
      }
      
      // Calculer le montant total
      this.montant_total = trajet.prix_par_place * this.nb_places;
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});


/**
 * Après la sauvegarde d'une nouvelle réservation,
 * on met à jour le nombre de places disponibles dans le trajet
 */
reservationSchema.post('save', async function(doc) {
  if (doc.statut === 'confirmee') {
    try {
      const Trajet = mongoose.model('Trajet');
      const trajet = await Trajet.findById(doc.trajet);
      
      if (trajet) {
        await trajet.reserveSeats(doc.nb_places);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du trajet:', error);
    }
  }
})

/**
 * Annuler une réservation
 */
reservationSchema.methods.cancel = async function() {
  if (this.statut === 'annulee') {
    throw new Error('Cette réservation est déjà annulée');
  }
  
  // Changer le statut
  this.statut = 'annulee';
  await this.save();
  
  // Libérer les places dans le trajet
  const Trajet = mongoose.model('Trajet');
  const trajet = await Trajet.findById(this.trajet);
  
  if (trajet) {
    await trajet.releaseSeats(this.nb_places);
  }
};

/**
 * Vérifier si la réservation peut être annulée
 * (par exemple, pas moins de 24h avant le départ)
 */
reservationSchema.methods.canBeCancelled = async function() {
  if (this.statut !== 'confirmee') {
    return false;
  }
  
  const Trajet = mongoose.model('Trajet');
  const trajet = await Trajet.findById(this.trajet);
  
  if (!trajet) {
    return false;
  }
  
  // Vérifier qu'il reste au moins 24h avant le départ
  const now = new Date();
  const departDate = new Date(trajet.date_depart);
  const hoursBeforeDeparture = (departDate - now) / (1000 * 60 * 60);
  
  return hoursBeforeDeparture >= 24;
};

/**
 * Marquer la réservation comme terminée
 */
reservationSchema.methods.complete = async function() {
  this.statut = 'terminee';
  await this.save();
};


/**
 * Obtenir toutes les réservations d'un utilisateur
 * 
 * @param {String} userId - ID de l'utilisateur
 * @param {String} status - Filtrer par statut (optionnel)
 */
reservationSchema.statics.getUserReservations = async function(userId, status = null) {
  const query = { passager: userId };
  
  if (status) {
    query.statut = status;
  }
  
  return await this.find(query)
    .populate('trajet')
    .populate({
      path: 'trajet',
      populate: {
        path: 'conducteur',
        select: 'nom prenom photo telephone'
      }
    })
    .sort({ date_reservation: -1 }); // Plus récent en premier
};

/* @param {String} trajetId - ID du trajet*/
 
reservationSchema.statics.getTrajetReservations = async function(trajetId) {
  return await this.find({ 
    trajet: trajetId,
    statut: { $ne: 'annulee' }  // Exclure les annulées
  })
    .populate('passager', 'nom prenom photo telephone')
    .sort({ date_reservation: 1 });
};

/**
 * Vérifier si un utilisateur a déjà réservé un trajet
 */

reservationSchema.statics.userHasReserved = async function(userId, trajetId) {
  const reservation = await this.findOne({
    passager: userId,
    trajet: trajetId,
    statut: { $in: ['confirmee', 'en_attente'] }
  });
  
  return !!reservation; // Retourne true si une réservation existe
};



/**
 * Vérifier qu'un passager ne réserve pas son propre trajet
 */

reservationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Trajet = mongoose.model('Trajet');
      const trajet = await Trajet.findById(this.trajet);
      
      if (!trajet) {
        return next(new Error('Trajet introuvable'));
      }
      
      // Vérifier que le passager n'est pas le conducteur
      
      if (trajet.conducteur.toString() === this.passager.toString()) {
        return next(new Error('Vous ne pouvez pas réserver votre propre trajet'));
      }
      
      // Vérifier qu'il y a assez de places
      if (!trajet.hasAvailableSeats(this.nb_places)) {
        return next(new Error('Pas assez de places disponibles'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

reservationSchema.index({ trajet: 1, passager: 1 });
reservationSchema.index({ passager: 1, statut: 1 });
reservationSchema.index({ trajet: 1, statut: 1 });

// Créer et exporter le modèle
const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
