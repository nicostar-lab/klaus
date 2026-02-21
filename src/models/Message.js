const mongoose = require('mongoose');

/**
 * SCHÉMA MESSAGE
 * Pour la messagerie entre conducteurs et passagers
 */
const messageSchema = new mongoose.Schema({
  // Conversation (identifiée par le trajet et les 2 utilisateurs)
  trajet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trajet',
    required: [true, 'Le trajet est obligatoire']
  },

  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },

  // Expéditeur
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'expéditeur est obligatoire']
  },

  // Destinataire
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le destinataire est obligatoire']
  },

  // Contenu du message
  contenu: {
    type: String,
    required: [true, 'Le message ne peut pas être vide'],
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères'],
    trim: true
  },

  // Statut de lecture
  lu: {
    type: Boolean,
    default: false
  },

  // Date de lecture
  dateLecture: {
    type: Date
  },

  // Type de message
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  }

}, {
  timestamps: true
});

/**
 * Index pour recherche rapide
 */
messageSchema.index({ trajet: 1, createdAt: -1 });
messageSchema.index({ expediteur: 1, destinataire: 1 });
messageSchema.index({ destinataire: 1, lu: 1 });

/**
 * Obtenir les messages d'une conversation
 */
messageSchema.statics.getConversation = async function(trajetId, userId1, userId2, limit = 50) {
  return await this.find({
    trajet: trajetId,
    $or: [
      { expediteur: userId1, destinataire: userId2 },
      { expediteur: userId2, destinataire: userId1 }
    ]
  })
    .populate('expediteur', 'nom prenom photo')
    .populate('destinataire', 'nom prenom photo')
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Marquer les messages comme lus
 */
messageSchema.statics.markAsRead = async function(trajetId, userId) {
  await this.updateMany(
    {
      trajet: trajetId,
      destinataire: userId,
      lu: false
    },
    {
      lu: true,
      dateLecture: new Date()
    }
  );
};

/**
 * Obtenir le nombre de messages non lus
 */
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    destinataire: userId,
    lu: false
  });
};

/**
 * Obtenir toutes les conversations d'un utilisateur
 */
messageSchema.statics.getUserConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { expediteur: new mongoose.Types.ObjectId(userId) },
          { destinataire: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          trajet: '$trajet',
          user: {
            $cond: [
              { $eq: ['$expediteur', new mongoose.Types.ObjectId(userId)] },
              '$destinataire',
              '$expediteur'
            ]
          }
        },
        dernierMessage: { $first: '$$ROOT' },
        nonLus: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$destinataire', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$lu', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'dernierMessage.createdAt': -1 }
    }
  ]);

  // Peupler les données
  await this.populate(conversations, [
    { path: 'dernierMessage.expediteur', select: 'nom prenom photo' },
    { path: 'dernierMessage.destinataire', select: 'nom prenom photo' },
    { path: 'dernierMessage.trajet', select: 'ville_depart ville_arrivee date_depart' },
    { path: '_id.user', select: 'nom prenom photo' }
  ]);

  return conversations;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;