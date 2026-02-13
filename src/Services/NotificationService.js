const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccountKey.json')),
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendNotification(user, title, message) {
  // Envoi par email
  if (user.email) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: title,
      text: message,
    });
  }

  // Envoi par notification 
  if (user.fcmToken) {
    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title,
        body: message,
      },
    });
  }
}

module.exports = { sendNotification };
