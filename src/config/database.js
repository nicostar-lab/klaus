const mongoose = require('mongoose');

/**
 * Connexion à la base de données MongoDB
 * 
 * Cette fonction se connecte à MongoDB en utilisant l'URL définie dans .env
 * Elle affiche un message de succès ou d'erreur
 */
const connectDB = async () => {
  try {
    const options = {
     
    };

    // Connexion à MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(' MongoDB connecté avec succès');
    console.log(` Host: ${conn.connection.host}`);
    console.log(` Base de données: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(' Erreur de connexion MongoDB:');
    console.error(`   Message: ${error.message}`);
    
    // Arrêter l'application si la connexion échoue
    process.exit(1);
  }
};

// Événements de connexion MongoDB (pour le monitoring)
mongoose.connection.on('connected', () => {
  console.log(' Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(' Erreur Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose déconnecté de MongoDB');
});

// Fermeture propre de la connexion lors de l'arrêt de l'application
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(' Connexion MongoDB fermée (arrêt de l\'application)');
  process.exit(0);
});

module.exports = connectDB;
