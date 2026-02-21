const Message = require('../models/Message');
const Trajet = require('../models/Trajet');
const Reservation = require('../models/Reservation');

/**
 * @desc    Envoyer un message
 * @route   POST /api/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const { trajet, destinataire, contenu, reservation } = req.body;

    // Validation
    if (!trajet || !destinataire || !contenu) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
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

    // Vérifier que l'utilisateur est concerné par ce trajet
    const isConducteur = trajetDoc.conducteur.toString() === req.user.id;
    
    let isPassager = false;
    if (reservation) {
      const reservationDoc = await Reservation.findById(reservation);
      isPassager = reservationDoc && reservationDoc.passager.toString() === req.user.id;
    }

    if (!isConducteur && !isPassager) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à envoyer des messages sur ce trajet'
      });
    }

    // Créer le message
    const message = await Message.create({
      trajet,
      reservation,
      expediteur: req.user.id,
      destinataire,
      contenu
    });

    await message.populate([
      { path: 'expediteur', select: 'nom prenom photo' },
      { path: 'destinataire', select: 'nom prenom photo' },
      { path: 'trajet', select: 'ville_depart ville_arrivee' }
    ]);

    // Émettre l'événement Socket.io (sera géré par le serveur Socket)
    if (req.app.get('io')) {
      req.app.get('io').to(destinataire.toString()).emit('nouveau_message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: message
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir une conversation
 * @route   GET /api/messages/conversation/:trajetId/:userId
 * @access  Private
 */
exports.getConversation = async (req, res) => {
  try {
    const { trajetId, userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await Message.getConversation(
      trajetId,
      req.user.id,
      userId,
      limit
    );

    // Marquer les messages comme lus
    await Message.markAsRead(trajetId, req.user.id);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.reverse() // Inverser pour avoir l'ordre chronologique
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir toutes mes conversations
 * @route   GET /api/messages/conversations
 * @access  Private
 */
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user.id);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir le nombre de messages non lus
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Erreur lors du comptage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Marquer une conversation comme lue
 * @route   PUT /api/messages/read/:trajetId
 * @access  Private
 */
exports.markConversationAsRead = async (req, res) => {
  try {
    await Message.markAsRead(req.params.trajetId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Messages marqués comme lus'
    });

  } catch (error) {
    console.error('Erreur lors du marquage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer un message
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'expéditeur
    if (message.expediteur.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message supprimé avec succès'
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