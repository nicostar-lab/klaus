const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['retard', 'rappel', 'reservation', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: false }, // ID du trajet ou réservation concerné
  scheduledAt: { type: Date, required: true }, // Quand la notification doit être envoyée
  sentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
