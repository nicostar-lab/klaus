 import api from './api';

/**
 * Service de gestion des trajets
 */
const trajetService = {
  /**
   * Créer un nouveau trajet
   */
  createTrajet: async (trajetData) => {
    try {
      const response = await api.post('/trajets', trajetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création du trajet' };
    }
  },

  /**
   * Obtenir tous les trajets (avec filtres optionnels)
   */
  getTrajets: async (filters = {}) => {
    try {
      const response = await api.get('/trajets', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des trajets' };
    }
  },

  /**
   * Rechercher des trajets
   */
  searchTrajets: async (searchParams) => {
    try {
      const response = await api.get('/trajets/search', { params: searchParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la recherche' };
    }
  },

  /**
   * Obtenir un trajet par ID
   */
  getTrajetById: async (id) => {
    try {
      const response = await api.get(`/trajets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du trajet' };
    }
  },

  /**
   * Obtenir les trajets de l'utilisateur connecté
   */
  getMyTrajets: async () => {
    try {
      const response = await api.get('/trajets/user/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération de vos trajets' };
    }
  },

  /**
   * Mettre à jour un trajet
   */
  updateTrajet: async (id, trajetData) => {
    try {
      const response = await api.put(`/trajets/${id}`, trajetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du trajet' };
    }
  },

  /**
   * Supprimer un trajet
   */
  deleteTrajet: async (id) => {
    try {
      const response = await api.delete(`/trajets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression du trajet' };
    }
  },

  /**
   * Signaler un retard
   */
  updateRetard: async (id, retard) => {
    try {
      const response = await api.put(`/trajets/${id}/retard`, { retard });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du retard' };
    }
  }
};

export default trajetService;