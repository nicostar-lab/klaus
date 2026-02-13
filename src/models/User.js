const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * SCHÉMA USER
 * 
 * Ce schéma définit la structure d'un utilisateur dans la base de données.
 * Il contient les informations personnelles et les méthodes pour gérer les mots de passe.
 */
const userSchema = new mongoose.Schema({
  // Informations personnelles
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,  // Enlève les espaces au début et à la fin
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  
  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,  // Un seul compte par email
    lowercase: true,  // Convertit en minuscules automatiquement
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Veuillez fournir un email valide'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false  // Ne pas retourner le password dans les requêtes par défaut
  },
  
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est obligatoire'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Le numéro doit contenir 10 chiffres']
  },
  
  // Informations du profil
  photo: {
    type: String,
    default: 'default-avatar.png'  // Photo par défaut
  },
  
  date_inscription: {
    type: Date,
    default: Date.now
  },
  
  // Système de notation
  note_moyenne: {
    type: Number,
    default: 0,
    min: [0, 'La note ne peut pas être négative'],
    max: [5, 'La note maximale est 5']
  },
  
  nb_evaluations: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Statut du compte
  isActive: {
    type: Boolean,
    default: true
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
  
}, {
  timestamps: true  // Ajoute automatiquement createdAt et updatedAt
});

// ============================================
// MIDDLEWARE PRE-SAVE : HASHER LE MOT DE PASSE
// ============================================
/**
 * Avant de sauvegarder un utilisateur, on hash son mot de passe
 * Cela se fait uniquement si le mot de passe a été modifié
 */
userSchema.pre('save', async function(next) {
  // Si le mot de passe n'a pas été modifié, on passe à l'étape suivante
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Générer un "salt" (grain de sel) pour rendre le hash unique
    const salt = await bcrypt.genSalt(10);
    
    // Hasher le mot de passe
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// MÉTHODES DU MODÈLE
// ============================================

/**
 * Comparer un mot de passe fourni avec le mot de passe hashé
 * 
 * @param {String} candidatePassword - Le mot de passe à vérifier
 * @returns {Boolean} - true si les mots de passe correspondent
 * 
 * Exemple d'utilisation :
 *   const isMatch = await user.comparePassword('motdepasse123');
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

/**
 * Obtenir les informations publiques de l'utilisateur
 * (sans le mot de passe et autres données sensibles)
 */
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    nom: this.nom,
    prenom: this.prenom,
    email: this.email,
    telephone: this.telephone,
    photo: this.photo,
    note_moyenne: this.note_moyenne,
    nb_evaluations: this.nb_evaluations,
    date_inscription: this.date_inscription
  };
};

/**
 * Mettre à jour la note moyenne après une nouvelle évaluation
 * 
 * @param {Number} newRating - La nouvelle note reçue (1-5)
 */
userSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.note_moyenne * this.nb_evaluations) + newRating;
  this.nb_evaluations += 1;
  this.note_moyenne = totalRating / this.nb_evaluations;
};

// ============================================
// INDEX POUR OPTIMISER LES RECHERCHES
// ============================================
userSchema.index({ email: 1 });  // Index sur l'email pour les recherches rapides

// Créer et exporter le modèle
const User = mongoose.model('User', userSchema);

module.exports = User;
