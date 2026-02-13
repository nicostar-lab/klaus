const jwt = require('jsonwebtoken');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
  let token;
  
  try {
    //  Vérifier si le token est dans le header Authorization

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Format attendu : "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }
    
    //  Vérifier que le token existe

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }
    
    // 3. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Récupérer l'utilisateur correspondant au token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non trouvé'
      });
    }
    
    // 5. Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }
    
    //  Attacher l'utilisateur à la requête pour l'utiliser dans les controllers

    req.user = user;
    
    //  Passer au middleware suivant (ou au controller)
    next();
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    // Gérer les différents types d'erreurs JWT

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré - Veuillez vous reconnecter'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification',
      error: error.message
    });
  }
};

/**
 * @desc    Vérifie que l'utilisateur est un administrateur
 * @note    À utiliser APRÈS le middleware protect
 * 
 * Utilisation :
 *   router.delete('/users/:id', protect, authorize('admin'), controller);
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {

    // Vérifier que l'utilisateur a le bon rôle

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé - Rôle ${req.user.role} non autorisé`
      });
    }
    next();
  };
};


exports.checkOwnership = (param = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[param];
    
    // Vérifier que l'utilisateur accède à ses propres données OU qu'il est admin
    
    if (resourceUserId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Vous ne pouvez accéder qu\'à vos propres ressources'
      });
    }
    
    next();
  };
};


exports.optionalAuth = async (req, res, next) => {
  let token;
  
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    
    // Ne pas bloquer si le token est invalide, juste continuer sans utilisateur

    console.log('Token invalide ou expiré (optionalAuth)');
  }
  
  next();
};
