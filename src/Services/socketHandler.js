// src/services/socketHandler.js
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);
    
    // Rejoindre une course spécifique
    socket.on('joinRide', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`Socket ${socket.id} a rejoint la course ${rideId}`);
    });

    // Quitter une course
    socket.on('leaveRide', (rideId) => {
      socket.leave(`ride_${rideId}`);
      console.log(`Socket ${socket.id} a quitté la course ${rideId}`);
    });

    // Mise à jour de la localisation du conducteur
    socket.on('locationUpdate', (data) => {
      socket.to(`ride_${data.rideId}`).emit('driverLocationUpdate', data);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });
};

module.exports = socketHandler;