import api from './api';

/**
 * Service de gestion des réservations
 */
const reservationService = {
  /**
   * Créer une nouvelle réservation
   */
  createReservation: async (reservationData) => {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création de la réservation' };
    }
  },

  /**
   * Obtenir les réservations de l'utilisateur connecté
   */
  getMyReservations: async (status = null) => {
    try {
      const params = status ? { statut: status } : {};
      const response = await api.get('/reservations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération de vos réservations' };
    }
  },

  /**
   * Obtenir une réservation par ID
   */
  getReservationById: async (id) => {
    try {
      const response = await api.get(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération de la réservation' };
    }
  },

  /**
   * Annuler une réservation
   */
  cancelReservation: async (id) => {
    try {
      const response = await api.delete(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'annulation de la réservation' };
    }
  },

  /**
   * Obtenir les réservations d'un trajet (pour le conducteur)
   */
  getTrajetReservations: async (trajetId) => {
    try {
      const response = await api.get(`/reservations/trajet/${trajetId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des réservations' };
    }
  },

  /**
   * Confirmer une réservation (conducteur)
   */
  confirmReservation: async (id) => {
    try {
      const response = await api.put(`/reservations/${id}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la confirmation' };
    }
  },

  /**
   * Marquer une réservation comme terminée
   */
  completeReservation: async (id) => {
    try {
      const response = await api.put(`/reservations/${id}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la complétion' };
    }
  }
};

export default reservationService;