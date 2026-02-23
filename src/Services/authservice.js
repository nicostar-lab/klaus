import api from "./api";

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et la gestion du profil
 */
const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      // Sauvegarder le token et les infos utilisateur
      if (response.data.success && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  },

  /**
   * Connexion d'un utilisateur
   */
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);

      // Sauvegarder le token et les infos utilisateur
      if (response.data.success && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la connexion" };
    }
  },

  /**
   * Déconnexion
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  },

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getMe: async () => {
    try {
      const response = await api.get("/auth/me");

      // Mettre à jour les infos utilisateur dans le localStorage
      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Erreur lors de la récupération du profil",
        }
      );
    }
  },

  /**
   * Mettre à jour le mot de passe
   */
  updatePassword: async (passwords) => {
    try {
      const response = await api.put("/auth/update-password", passwords);

      // Mettre à jour le token si un nouveau est fourni
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Erreur lors de la mise à jour du mot de passe",
        }
      );
    }
  },

  /**
   * Mettre à jour le profil
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/auth/update-profile", profileData);

      // Mettre à jour les infos utilisateur
      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Erreur lors de la mise à jour du profil",
        }
      );
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return !!token;
  },

  /**
   * Obtenir l'utilisateur depuis le localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Obtenir le token
   */
  getToken: () => {
    return localStorage.getItem("token");
  },
};

export default authService;
