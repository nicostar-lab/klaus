const cron = require('node-cron');
const Notification = require('../models/notification');
const { sendNotification } = require('../Services/NotificationService');

module.exports = {
  startCronJobs: () => {
    // Vérifie toutes les minutes s'il y a des notifications à envoyer
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const notifications = await Notification.find({
        scheduledAt: { $lte: now },
        sentAt: { $exists: false }
      }).populate('user');

      for (const notification of notifications) {
        await sendNotification(notification.user, notification.title, notification.message);
        notification.sentAt = now;
        await notification.save();
      }
    });

    // Planifie les notifications de retard 30 minutes avant le départ
    cron.schedule('*/5 * * * *', async () => {
      const now = new Date();
      const delay = 30 * 60 * 1000; // 30 minutes en ms
      const trajets = await Trajet.find({
        statut: 'actif',
        date_depart: { $gte: new Date(now.getTime() + delay), $lte: new Date(now.getTime() + delay + 5 * 60 * 1000) },
        retard: { $gt: 0 }
      }).populate('conducteur');

      for (const trajet of trajets) {
        const departureTime = new Date(trajet.date_depart);
        const notificationTime = new Date(departureTime.getTime() - delay);
        const message = `Votre trajet ${trajet.ville_depart} → ${trajet.ville_arrivee} a ${trajet.retard} minutes de retard. Nouveau départ prévu à ${departureTime}.`;

        // Notification pour le conducteur
        await Notification.create({
          user: trajet.conducteur._id,
          title: 'Retard sur votre trajet',
          message,
          type: 'retard',
          relatedId: trajet._id,
          scheduledAt: notificationTime,
        });

        // Notification pour les passagers
        const reservations = await Reservation.find({ trajet: trajet._id, statut: 'confirmee' }).populate('passager');
        for (const reservation of reservations) {
          await Notification.create({
            user: reservation.passager._id,
            title: 'Retard sur votre trajet réservé',
            message,
            type: 'retard',
            relatedId: trajet._id,
            scheduledAt: notificationTime,
          });
        }
      }
    });
  }
};
