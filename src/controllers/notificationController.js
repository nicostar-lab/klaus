const Notification = require('../models/Notification');

/**
 * @desc    Obtenir mes notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      lu: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Marquer une notification comme lue
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    notification.lu = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('Erreur marquage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Marquer toutes les notifications comme lues
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, lu: false },
      { lu: true }
    );

    res.status(200).json({
      success: true,
      message: 'Toutes les notifications marquées comme lues'
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer une notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * @desc    Créer une notification (utilisé par le système)
 * @route   POST /api/notifications
 * @access  Private (système)
 */
exports.createNotification = async (userId, data) => {
  try {
    const notification = await Notification.create({
      user: userId,
      titre: data.titre,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId
    });

    // Émettre via Socket.io si disponible
    const io = global.io;
    if (io) {
      io.to(userId.toString()).emit('nouvelle_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
};

module.exports = exports;