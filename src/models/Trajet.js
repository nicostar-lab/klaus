const mongoose = require('mongoose');

/**
 * SCHÉMA TRAJET
 */
const trajetSchema = new mongoose.Schema({
  // Conducteur (référence vers User)
  conducteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Fait référence au modèle User
    required: [true, 'Le conducteur est obligatoire']
  },
  
  // Informations du trajet

  ville_depart: {
    type: String,
    required: [true, 'La ville de départ est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom de la ville doit contenir au moins 2 caractères']
  },
  
  ville_arrivee: {
    type: String,
    required: [true, 'La ville d\'arrivée est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom de la ville doit contenir au moins 2 caractères']
  },
  
  date_depart: {
    type: Date,
    required: [true, 'La date de départ est obligatoire'],
    validate: {
      validator: function(value) {
        // La date doit être dans le futur
        return value > new Date();
      },
      message: 'La date de départ doit être dans le futur'
    }
  },
  
  heure_depart: {
    type: String,
    required: [true, 'L\'heure de départ est obligatoire'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'L\'heure doit être au format HH:MM']
  },
  
  // Gestion des places
  places_totales: {
    type: Number,
    required: [true, 'Le nombre de places est obligatoire'],
    min: [1, 'Il doit y avoir au moins 1 place'],
    max: [8, 'Maximum 8 places autorisées']
  },
  
  places_disponibles: {
    type: Number,
    required: true,
    min: [0, 'Le nombre de places disponibles ne peut pas être négatif']
  },
  
  // Prix
  prix_par_place: {
    type: Number,
    required: [true, 'Le prix par place est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  
  // Informations supplémentaires
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    trim: true
  },
  
  // Statut du trajet
  statut: {
    type: String,
    enum: {
      values: ['actif', 'complet', 'annule', 'termine'],
      message: 'Le statut doit être : actif, complet, annule ou termine'
    },
    default: 'actif'
  },
  
  // Véhicule utilisé (optionnel)
  vehicule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule'
  },
  
  // Points de passage (optionnel)
  points_passage: [{
    ville: String,
    ordre: Number
  }]
  
}, {
  timestamps: true  // Ajoute createdAt et updatedAt automatiquement
});

// ============================================
// MIDDLEWARE PRE-SAVE : INITIALISER LES PLACES
// ============================================
/**
 * Avant de sauvegarder, si c'est un nouveau trajet,
 * on initialise places_disponibles = places_totales
 */
trajetSchema.pre('save', function(next) {
  if (this.isNew) {
    this.places_disponibles = this.places_totales;
  }
  next();
});

// ============================================
// MÉTHODES DU MODÈLE
// ============================================

/**
 * Vérifier si des places sont disponibles
 * 
 * @param {Number} nbPlaces - Nombre de places demandées
 * @returns {Boolean}
 */
trajetSchema.methods.hasAvailableSeats = function(nbPlaces = 1) {
  return this.places_disponibles >= nbPlaces && this.statut === 'actif';
};

/**
 * Réserver des places
 * 
 * @param {Number} nbPlaces - Nombre de places à réserver
 * @throws {Error} Si pas assez de places disponibles
 */
trajetSchema.methods.reserveSeats = async function(nbPlaces) {
  if (!this.hasAvailableSeats(nbPlaces)) {
    throw new Error('Pas assez de places disponibles');
  }
  
  this.places_disponibles -= nbPlaces;
  
  // Si toutes les places sont réservées, passer le statut à "complet"
  if (this.places_disponibles === 0) {
    this.statut = 'complet';
  }
  
  await this.save();
};

/**
 * Libérer des places (en cas d'annulation de réservation)
 * 
 * @param {Number} nbPlaces - Nombre de places à libérer
 */
trajetSchema.methods.releaseSeats = async function(nbPlaces) {
  this.places_disponibles += nbPlaces;
  
  // Si le trajet était complet, le repasser à actif
  if (this.statut === 'complet') {
    this.statut = 'actif';
  }
  
  // S'assurer qu'on ne dépasse pas le nombre total de places
  if (this.places_disponibles > this.places_totales) {
    this.places_disponibles = this.places_totales;
  }
  
  await this.save();
};

/**
 * Vérifier si le trajet est encore valide (date non dépassée)
 */
trajetSchema.methods.isStillValid = function() {
  const now = new Date();
  return this.date_depart > now && this.statut !== 'termine' && this.statut !== 'annule';
};

/**
 * Calculer le prix total pour un nombre de places donné
 * 
 * @param {Number} nbPlaces
 * @returns {Number}
 */
trajetSchema.methods.calculateTotalPrice = function(nbPlaces) {
  return this.prix_par_place * nbPlaces;
};

// ============================================
// MÉTHODES STATIQUES (appelées sur le modèle, pas sur une instance)
// ============================================

/**
 * Rechercher des trajets selon des critères
 * 
 * @param {Object} criteria - Critères de recherche
 * @returns {Array} - Liste des trajets trouvés
 * 
 * Exemple :
 *   const trajets = await Trajet.searchTrajets({
 *     ville_depart: 'Paris',
 *     ville_arrivee: 'Lyon',
 *     date_depart: '2024-12-25'
 *   });
 */
trajetSchema.statics.searchTrajets = async function(criteria) {
  const query = { statut: 'actif' };
  
  if (criteria.ville_depart) {
    query.ville_depart = new RegExp(criteria.ville_depart, 'i'); // Recherche insensible à la casse
  }
  
  if (criteria.ville_arrivee) {
    query.ville_arrivee = new RegExp(criteria.ville_arrivee, 'i');
  }
  
  if (criteria.date_depart) {
    // Rechercher les trajets le même jour
    const startDate = new Date(criteria.date_depart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(criteria.date_depart);
    endDate.setHours(23, 59, 59, 999);
    
    query.date_depart = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  if (criteria.prix_max) {
    query.prix_par_place = { $lte: criteria.prix_max };
  }
  
  if (criteria.places_min) {
    query.places_disponibles = { $gte: criteria.places_min };
  }
  
  return await this.find(query)
    .populate('conducteur', 'nom prenom photo note_moyenne')
    .populate('vehicule')
    .sort({ date_depart: 1 }); // Trier par date croissante
};

// ============================================
// INDEX POUR OPTIMISER LES RECHERCHES
// ============================================
trajetSchema.index({ ville_depart: 1, ville_arrivee: 1, date_depart: 1 });
trajetSchema.index({ conducteur: 1 });
trajetSchema.index({ statut: 1 });
trajetSchema.index({ date_depart: 1 });

// Créer et exporter le modèle
const Trajet = mongoose.model('Trajet', trajetSchema);

module.exports = Trajet;
